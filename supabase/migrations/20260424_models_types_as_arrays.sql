-- Migration: Convert models.boiler_type and models.fuel_type to arrays
-- These are now computed/aggregated from the variants under each model.
-- Date: 2026-04-24

-- 1. Add new array columns
ALTER TABLE models
  ADD COLUMN boiler_types boiler_type[] NOT NULL DEFAULT '{}',
  ADD COLUMN fuel_types   fuel_type[]   NOT NULL DEFAULT '{}';

-- 2. Backfill: seed arrays from existing single-value columns (if set)
UPDATE models
SET
  boiler_types = CASE WHEN boiler_type IS NOT NULL THEN ARRAY[boiler_type] ELSE '{}' END,
  fuel_types   = CASE WHEN fuel_type   IS NOT NULL THEN ARRAY[fuel_type]   ELSE '{}' END;

-- 3. Backfill: aggregate unique types from variants that already have types set
UPDATE models m
SET
  boiler_types = (
    SELECT ARRAY(
      SELECT DISTINCT v.boiler_type
      FROM variants v
      WHERE v.model_id = m.id AND v.boiler_type IS NOT NULL
      ORDER BY v.boiler_type
    )
  ),
  fuel_types = (
    SELECT ARRAY(
      SELECT DISTINCT v.fuel_type
      FROM variants v
      WHERE v.model_id = m.id AND v.fuel_type IS NOT NULL
      ORDER BY v.fuel_type
    )
  )
WHERE EXISTS (
  SELECT 1 FROM variants v
  WHERE v.model_id = m.id AND (v.boiler_type IS NOT NULL OR v.fuel_type IS NOT NULL)
);

-- 4. Drop the old single-value columns
ALTER TABLE models
  DROP COLUMN boiler_type,
  DROP COLUMN fuel_type;

-- 5. Create a function to recompute a model's type arrays from its variants
CREATE OR REPLACE FUNCTION recompute_model_types(p_model_id uuid)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE models
  SET
    boiler_types = (
      SELECT ARRAY(
        SELECT DISTINCT v.boiler_type
        FROM variants v
        WHERE v.model_id = p_model_id AND v.boiler_type IS NOT NULL
        ORDER BY v.boiler_type
      )
    ),
    fuel_types = (
      SELECT ARRAY(
        SELECT DISTINCT v.fuel_type
        FROM variants v
        WHERE v.model_id = p_model_id AND v.fuel_type IS NOT NULL
        ORDER BY v.fuel_type
      )
    )
  WHERE id = p_model_id;
END;
$$;

-- 6. Trigger function: keep model types in sync whenever a variant is inserted/updated/deleted
CREATE OR REPLACE FUNCTION trg_sync_model_types()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_model_id uuid;
BEGIN
  -- Determine which model to recompute
  IF TG_OP = 'DELETE' THEN
    v_model_id := OLD.model_id;
  ELSE
    v_model_id := NEW.model_id;
  END IF;

  PERFORM recompute_model_types(v_model_id);
  RETURN NULL; -- AFTER trigger
END;
$$;

-- 7. Attach trigger to variants table
DROP TRIGGER IF EXISTS sync_model_types ON variants;
CREATE TRIGGER sync_model_types
  AFTER INSERT OR UPDATE OF boiler_type, fuel_type OR DELETE
  ON variants
  FOR EACH ROW
  EXECUTE FUNCTION trg_sync_model_types();
