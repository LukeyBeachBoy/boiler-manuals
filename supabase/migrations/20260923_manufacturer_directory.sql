-- Manufacturer directory, preserving all existing manufacturer/model/manual IDs.
-- Current signed-in accounts already have full edit access; seed them as admins
-- before narrowing write policies, so the admin app remains usable.
create table public.directory_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.directory_admins enable row level security;
insert into public.directory_admins (user_id)
select id from auth.users
on conflict do nothing;

create or replace function public.is_directory_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.directory_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_directory_admin() from public;
grant execute on function public.is_directory_admin() to authenticated;

alter table public.manufacturers
  add column description text,
  add column logo_path text,
  add column search_keywords text[] not null default '{}',
  add column technical_support_hours text,
  add column uk_headquarters text,
  add column warranty_information text,
  add column training_available text,
  add column approved_installer_scheme text,
  add column notes text,
  add column published boolean not null default false,
  add column updated_at timestamptz not null default now();

create index manufacturers_keywords_idx on public.manufacturers using gin(search_keywords);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  display_order integer not null default 0,
  constraint category_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
insert into public.product_categories (slug,name,display_order) values
  ('boilers','Boilers',0),('commercial-boilers','Commercial Boilers',1),
  ('heat-pumps','Heat Pumps',2),('water-heaters','Water Heaters',3),
  ('heating-controls','Heating Controls',4),('pumps','Pumps',5),
  ('motorised-valves','Motorised Valves',6),('cylinders','Cylinders',7),
  ('radiators','Radiators',8),('underfloor-heating','Underfloor Heating',9),
  ('flues','Flues',10),('oil-heating','Oil Heating',11),
  ('lpg-equipment','LPG Equipment',12),('plumbing-products','Plumbing Products',13),
  ('tools-test-equipment','Tools & Test Equipment',14);

create table public.manufacturer_categories (
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  primary key(manufacturer_id,category_id)
);
create index manufacturer_categories_category_idx on public.manufacturer_categories(category_id);

create table public.manufacturer_contacts (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  kind text not null check (kind in ('phone','email','website','social')),
  label text not null check (length(trim(label)) > 0),
  value text not null check (length(trim(value)) > 0),
  platform text,
  action_role text check (action_role in ('technical_support','main_website','external_manuals')),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint contact_action_kind check (
    action_role is null or
    (kind='phone' and action_role='technical_support') or
    (kind='website' and action_role in ('main_website','external_manuals'))
  ),
  constraint social_platform check (kind <> 'social' or length(trim(coalesce(platform,''))) > 0)
);
create index manufacturer_contacts_order_idx on public.manufacturer_contacts(manufacturer_id,kind,display_order);
create unique index manufacturer_contacts_action_idx
  on public.manufacturer_contacts(manufacturer_id,action_role) where action_role is not null;

alter table public.product_categories enable row level security;
alter table public.manufacturer_categories enable row level security;
alter table public.manufacturer_contacts enable row level security;

create policy "Read product categories" on public.product_categories for select to anon,authenticated using (true);
create policy "Admins write product categories" on public.product_categories for all to authenticated
  using ((select public.is_directory_admin())) with check ((select public.is_directory_admin()));
create policy "Read visible manufacturer categories" on public.manufacturer_categories for select to anon,authenticated
  using (exists (select 1 from public.manufacturers m where m.id=manufacturer_id));
create policy "Admins write manufacturer categories" on public.manufacturer_categories for all to authenticated
  using ((select public.is_directory_admin())) with check ((select public.is_directory_admin()));
create policy "Read visible manufacturer contacts" on public.manufacturer_contacts for select to anon,authenticated
  using (exists (select 1 from public.manufacturers m where m.id=manufacturer_id));
create policy "Admins write manufacturer contacts" on public.manufacturer_contacts for all to authenticated
  using ((select public.is_directory_admin())) with check ((select public.is_directory_admin()));

-- Replace the broad, authenticated-user edit policies on existing tables.
do $$
declare t text; p record;
begin
  foreach t in array array['manufacturers','models','variants','manuals','manual_variants'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',p.policyname,t);
    end loop;
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_directory_admin())) with check ((select public.is_directory_admin()))',
      'Admins manage '||t,t);
  end loop;
end $$;

create policy "Read published manufacturers" on public.manufacturers
  for select to anon,authenticated using (published);
create policy "Read published models" on public.models
  for select to authenticated using (exists
    (select 1 from public.manufacturers m where m.id=manufacturer_id));
create policy "Read published variants" on public.variants
  for select to authenticated using (exists
    (select 1 from public.models mo where mo.id=model_id));
create policy "Read published manuals" on public.manuals
  for select to authenticated using (exists
    (select 1 from public.models mo where mo.id=model_id));
create policy "Read published manual variants" on public.manual_variants
  for select to authenticated using (exists
    (select 1 from public.manuals ma where ma.id=manual_id));

-- Views should respect underlying RLS, including unpublished manufacturers.
alter view public.manual_details set (security_invoker=true);
alter view public.variant_details set (security_invoker=true);

-- Existing PDFs remain private, but upload/delete now require the admin role.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
    where schemaname='storage' and tablename='objects' and policyname like 'Authenticated users can % manuals'
  loop
    execute format('drop policy %I on storage.objects',p.policyname);
  end loop;
end $$;
create policy "Admins write manuals" on storage.objects for insert to authenticated
  with check (bucket_id='manuals' and (select public.is_directory_admin()));
create policy "Admins update manuals" on storage.objects for update to authenticated
  using (bucket_id='manuals' and (select public.is_directory_admin()))
  with check (bucket_id='manuals' and (select public.is_directory_admin()));
create policy "Admins delete manuals" on storage.objects for delete to authenticated
  using (bucket_id='manuals' and (select public.is_directory_admin()));
create policy "Signed in users read manuals" on storage.objects for select to authenticated
  using (bucket_id='manuals');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('manufacturer-logos','manufacturer-logos',true,2097152,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
create policy "Admins upload logos" on storage.objects for insert to authenticated
  with check (bucket_id='manufacturer-logos' and (select public.is_directory_admin()));
create policy "Admins update logos" on storage.objects for update to authenticated
  using (bucket_id='manufacturer-logos' and (select public.is_directory_admin()))
  with check (bucket_id='manufacturer-logos' and (select public.is_directory_admin()));
create policy "Admins delete logos" on storage.objects for delete to authenticated
  using (bucket_id='manufacturer-logos' and (select public.is_directory_admin()));
create policy "Anyone reads logos" on storage.objects for select to anon,authenticated
  using (bucket_id='manufacturer-logos');
