-- Migration: Create manufacturer directory tables
-- Date: 2026-06-26
-- Context: Builds the backend for the GasCertPro Manufacturer Hub —
-- a searchable directory of boiler/heating/plumbing manufacturers.
-- Extends the existing manufacturers table (currently just id + name)
-- with contact details, product categories, and status badges.

-- ============================================================
-- 1. PRODUCT CATEGORIES
-- ============================================================
CREATE TABLE public.product_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  icon       text NOT NULL DEFAULT 'cube',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the 16 product categories
INSERT INTO public.product_categories (name, icon, sort_order) VALUES
  ('Boilers',                   'flame-outline',           1),
  ('Heat Pumps',                'thermometer-outline',     2),
  ('Cylinders',                 'water-outline',           3),
  ('Water Heaters',             'water-outline',           4),
  ('Pumps',                     'cog-outline',             5),
  ('Controls',                  'options-outline',         6),
  ('Underfloor Heating',        'grid-outline',            7),
  ('Radiators',                 'sunny-outline',           8),
  ('Valves',                    'git-branch-outline',      9),
  ('Pressurisation Units',      'speedometer-outline',    10),
  ('Expansion Vessels',         'ellipse-outline',        11),
  ('Flues',                     'arrow-up-outline',       12),
  ('Commercial Boilers',        'business-outline',       13),
  ('Burners',                   'bonfire-outline',        14),
  ('LPG Equipment',             'flash-outline',          15),
  ('Gas Controls & Safety',     'shield-checkmark-outline', 16)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. STATUS BADGES
-- ============================================================
CREATE TABLE public.status_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  icon       text NOT NULL DEFAULT 'checkmark-circle',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.status_badges (name, icon, sort_order) VALUES
  ('24/7 Technical Support',     'time-outline',         1),
  ('Live Chat Available',        'chatbubbles-outline',  2),
  ('Online Parts Lookup',        'search-outline',       3),
  ('Next-Day Spares',            'rocket-outline',       4),
  ('Training Available',         'school-outline',       5),
  ('Extended Warranty',          'shield-outline',       6)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. EXTEND manufacturers table
--    Existing columns: id, name, created_at
--    New columns below are all nullable — existing manufacturers
--    (which only have name) are unaffected.
-- ============================================================
ALTER TABLE public.manufacturers
  ADD COLUMN slug              text,
  ADD COLUMN logo_url          text,
  ADD COLUMN description       text,
  ADD COLUMN headquarters      text,
  ADD COLUMN website           text,
  ADD COLUMN phone_numbers     jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN emails            jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN custom_links      jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN social_links      jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN tech_info         jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN internal_notes    text,
  ADD COLUMN is_featured       boolean NOT NULL DEFAULT false,
  ADD COLUMN is_active         boolean NOT NULL DEFAULT true,
  ADD COLUMN updated_at        timestamptz NOT NULL DEFAULT now();

-- Backfill slugs from existing names
UPDATE public.manufacturers
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'))
WHERE slug IS NULL;

-- Add unique constraint once backfilled
ALTER TABLE public.manufacturers ADD CONSTRAINT manufacturers_slug_unique UNIQUE (slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_manufacturer_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_manufacturer_updated_at
  BEFORE UPDATE ON public.manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manufacturer_updated_at();

-- Indexes
CREATE INDEX idx_manufacturers_slug ON public.manufacturers USING btree (slug);
CREATE INDEX idx_manufacturers_featured ON public.manufacturers USING btree (is_featured) WHERE is_featured = true;
CREATE INDEX idx_manufacturers_active ON public.manufacturers USING btree (is_active) WHERE is_active = true;
CREATE INDEX idx_manufacturers_phone_numbers ON public.manufacturers USING gin (phone_numbers);
CREATE INDEX idx_manufacturers_custom_links ON public.manufacturers USING gin (custom_links);

-- ============================================================
-- 4. MANUFACTURER ↔ PRODUCT CATEGORIES
-- ============================================================
CREATE TABLE public.manufacturer_product_categories (
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (manufacturer_id, category_id)
);

CREATE INDEX idx_mpc_category ON public.manufacturer_product_categories USING btree (category_id);

-- ============================================================
-- 5. MANUFACTURER ↔ STATUS BADGES
-- ============================================================
CREATE TABLE public.manufacturer_status_badges (
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  badge_id        uuid NOT NULL REFERENCES public.status_badges(id) ON DELETE CASCADE,
  PRIMARY KEY (manufacturer_id, badge_id)
);

CREATE INDEX idx_msb_badge ON public.manufacturer_status_badges USING btree (badge_id);

-- ============================================================
-- 6. USER FAVOURITES
-- ============================================================
CREATE TABLE public.manufacturer_favourites (
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manufacturer_id uuid NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, manufacturer_id)
);

-- ============================================================
-- 7. ROW-LEVEL SECURITY
-- ============================================================

-- Product categories: everyone authenticated can read; admin-only writes
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product categories"
  ON public.product_categories
  FOR SELECT TO authenticated
  USING (true);

-- Status badges: everyone authenticated can read; admin-only writes
ALTER TABLE public.status_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read status badges"
  ON public.status_badges
  FOR SELECT TO authenticated
  USING (true);

-- Manufacturers: everyone reads active; admin writes
-- (Existing RLS on manufacturers should already allow reads; this adds write policies)
CREATE POLICY "Admins can insert manufacturers"
  ON public.manufacturers
  FOR INSERT TO authenticated
  WITH CHECK (true);  -- Permissive for now; tighten to admin role later

CREATE POLICY "Admins can update manufacturers"
  ON public.manufacturers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete manufacturers"
  ON public.manufacturers
  FOR DELETE TO authenticated
  USING (true);

-- Join tables: everyone reads
ALTER TABLE public.manufacturer_product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manufacturer categories"
  ON public.manufacturer_product_categories
  FOR SELECT TO authenticated
  USING (true);

ALTER TABLE public.manufacturer_status_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read manufacturer badges"
  ON public.manufacturer_status_badges
  FOR SELECT TO authenticated
  USING (true);

-- Favourites: each user manages their own
ALTER TABLE public.manufacturer_favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favourites"
  ON public.manufacturer_favourites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. SEARCH FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_manufacturers(search_query text)
RETURNS SETOF public.manufacturers
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT m.*
  FROM public.manufacturers m
  WHERE m.is_active = true
    AND (
      m.name ILIKE '%' || search_query || '%'
      OR m.slug ILIKE '%' || search_query || '%'
      OR m.description ILIKE '%' || search_query || '%'
    )
  ORDER BY m.is_featured DESC, m.name ASC;
$$;
