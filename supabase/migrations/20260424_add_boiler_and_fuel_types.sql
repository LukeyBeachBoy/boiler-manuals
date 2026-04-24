-- Migration: Add boiler_type and fuel_type to models and variants
-- Date: 2026-04-24

-- Create enums
CREATE TYPE boiler_type AS ENUM ('combi', 'heat_only', 'system');
CREATE TYPE fuel_type AS ENUM ('natural_gas', 'lpg', 'oil');

-- Add columns to models table (nullable — existing rows unaffected)
ALTER TABLE models
  ADD COLUMN boiler_type boiler_type NULL,
  ADD COLUMN fuel_type fuel_type NULL;

-- Add columns to variants table (nullable — inherits from model by default in UI)
ALTER TABLE variants
  ADD COLUMN boiler_type boiler_type NULL,
  ADD COLUMN fuel_type fuel_type NULL;
