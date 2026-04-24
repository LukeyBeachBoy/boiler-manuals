-- Migration: Backfill boiler_type and fuel_type from existing names
-- Date: 2026-04-24

-- ============================================================
-- MODELS: set boiler_type from name
-- ============================================================
UPDATE models SET boiler_type = 'combi'
  WHERE boiler_type IS NULL
    AND name ~* '(^|\s|-)combi(\s|-|$)';

UPDATE models SET boiler_type = 'heat_only'
  WHERE boiler_type IS NULL
    AND name ~* '(^|\s|-)heat[\s-]*only(\s|-|$)';

UPDATE models SET boiler_type = 'system'
  WHERE boiler_type IS NULL
    AND name ~* '(^|\s|-)system(\s|-|$)';

-- ============================================================
-- MODELS: set fuel_type from name
-- ============================================================
UPDATE models SET fuel_type = 'lpg'
  WHERE fuel_type IS NULL
    AND name ~* '(^|\s|-)lpg(\s|-|$)';

UPDATE models SET fuel_type = 'natural_gas'
  WHERE fuel_type IS NULL
    AND name ~* '(^|\s|-)(ng|natural[\s-]*gas)(\s|-|$)';

UPDATE models SET fuel_type = 'oil'
  WHERE fuel_type IS NULL
    AND name ~* '(^|\s|-)oil(\s|-|$)';

-- ============================================================
-- MODELS: strip type keywords from name
-- ============================================================
UPDATE models SET name = trim(regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(name,
          '\s*-?\s*\bheat[\s-]*only\b\s*',  '', 'gi'),
        '\s*-?\s*\bcombi\b\s*',             '', 'gi'),
      '\s*-?\s*\bsystem\b\s*',             '', 'gi'),
    '\s*-?\s*\blpg\b\s*',                  '', 'gi'),
  '\s*-?\s*\bnatural[\s-]*gas\b\s*',       '', 'gi')
);

-- tidy up trailing/leading dashes
UPDATE models SET name = trim(both '-' from trim(name));
UPDATE models SET name = regexp_replace(name, '\s*-\s*$', '', 'g');
UPDATE models SET name = regexp_replace(name, '^\s*-\s*', '', 'g');

-- ============================================================
-- VARIANTS: set boiler_type from name
-- ============================================================
UPDATE variants SET boiler_type = 'combi'
  WHERE boiler_type IS NULL
    AND name ~* '(^|\s|-)combi(\s|-|$)';

UPDATE variants SET boiler_type = 'heat_only'
  WHERE boiler_type IS NULL
    AND name ~* '(^|\s|-)heat[\s-]*only(\s|-|$)';

UPDATE variants SET boiler_type = 'system'
  WHERE boiler_type IS NULL
    AND name ~* '(^|\s|-)system(\s|-|$)';

-- ============================================================
-- VARIANTS: set fuel_type from name
-- ============================================================
UPDATE variants SET fuel_type = 'lpg'
  WHERE fuel_type IS NULL
    AND name ~* '(^|\s|-)lpg(\s|-|$)';

UPDATE variants SET fuel_type = 'natural_gas'
  WHERE fuel_type IS NULL
    AND name ~* '(^|\s|-)(ng|natural[\s-]*gas)(\s|-|$)';

UPDATE variants SET fuel_type = 'oil'
  WHERE fuel_type IS NULL
    AND name ~* '(^|\s|-)oil(\s|-|$)';

-- ============================================================
-- VARIANTS: strip type keywords from name (including NG for variants)
-- ============================================================
UPDATE variants SET name = trim(regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(name,
            '\s*-?\s*\bheat[\s-]*only\b\s*',  '', 'gi'),
          '\s*-?\s*\bcombi\b\s*',             '', 'gi'),
        '\s*-?\s*\bsystem\b\s*',             '', 'gi'),
      '\s*-?\s*\blpg\b\s*',                  '', 'gi'),
    '\s*-?\s*\bng\b\s*',                     '', 'gi'),
  '\s*-?\s*\bnatural[\s-]*gas\b\s*',         '', 'gi')
);

UPDATE variants SET name = trim(both '-' from trim(name));
UPDATE variants SET name = regexp_replace(name, '\s*-\s*$', '', 'g');
UPDATE variants SET name = regexp_replace(name, '^\s*-\s*', '', 'g');
