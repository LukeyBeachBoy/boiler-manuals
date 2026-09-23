-- Save profile and related rows in one transaction. Logo objects are uploaded
-- separately; the profile stores their path after upload succeeds.
create or replace function public.save_manufacturer_directory(
  p_manufacturer_id uuid,
  p_profile jsonb,
  p_contacts jsonb,
  p_category_ids uuid[]
) returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if not (select public.is_directory_admin()) then
    raise exception 'Only directory admins may edit manufacturers' using errcode='42501';
  end if;

  update public.manufacturers set
    name = trim(p_profile->>'name'),
    description = nullif(trim(p_profile->>'description'),''),
    logo_path = nullif(trim(p_profile->>'logo_path'),''),
    search_keywords = coalesce(
      (select array_agg(trim(x)) from jsonb_array_elements_text(p_profile->'search_keywords') x where length(trim(x))>0),
      '{}'::text[]
    ),
    technical_support_hours = nullif(trim(p_profile->>'technical_support_hours'),''),
    uk_headquarters = nullif(trim(p_profile->>'uk_headquarters'),''),
    warranty_information = nullif(trim(p_profile->>'warranty_information'),''),
    training_available = nullif(trim(p_profile->>'training_available'),''),
    approved_installer_scheme = nullif(trim(p_profile->>'approved_installer_scheme'),''),
    notes = nullif(trim(p_profile->>'notes'),''),
    published = coalesce((p_profile->>'published')::boolean,false),
    updated_at = now()
  where id = p_manufacturer_id;
  if not found then
    raise exception 'Manufacturer not found' using errcode='P0002';
  end if;

  delete from public.manufacturer_contacts where manufacturer_id=p_manufacturer_id;
  insert into public.manufacturer_contacts(id,manufacturer_id,kind,label,value,platform,action_role,display_order)
  select coalesce(r.id,gen_random_uuid()),p_manufacturer_id,r.kind,trim(r.label),trim(r.value),
         nullif(trim(r.platform),''),nullif(r.action_role,''),r.display_order
  from jsonb_to_recordset(coalesce(p_contacts,'[]'::jsonb))
       as r(id uuid,kind text,label text,value text,platform text,action_role text,display_order integer);

  delete from public.manufacturer_categories where manufacturer_id=p_manufacturer_id;
  insert into public.manufacturer_categories(manufacturer_id,category_id)
  select p_manufacturer_id,x from unnest(coalesce(p_category_ids,'{}'::uuid[])) x;
end;
$$;
revoke all on function public.save_manufacturer_directory(uuid,jsonb,jsonb,uuid[]) from public;
grant execute on function public.save_manufacturer_directory(uuid,jsonb,jsonb,uuid[]) to authenticated;

-- Make API privileges explicit for the new tables.
grant select on public.product_categories,public.manufacturer_contacts,public.manufacturer_categories to anon;
grant select,insert,update,delete on public.product_categories,public.manufacturer_contacts,public.manufacturer_categories to authenticated;
grant select on public.manufacturers to anon;
