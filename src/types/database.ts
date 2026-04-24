import type { Tables } from './supabase';

// Base types derived from generated Supabase schema
export type Manufacturer = Tables<'manufacturers'>;
export type Model = Tables<'models'>;
export type Variant = Tables<'variants'>;
export type Manual = Tables<'manuals'>;
export type ManualVariant = Tables<'manual_variants'>;

// Boiler and fuel type enums (match the DB enum values)
export type BoilerType = 'combi' | 'heat_only' | 'system';
export type FuelType = 'natural_gas' | 'lpg' | 'oil';

export const BOILER_TYPE_LABELS: Record<BoilerType, string> = {
  combi: 'Combi boiler',
  heat_only: 'Heat only boiler',
  system: 'System boiler',
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  natural_gas: 'Natural Gas',
  lpg: 'LPG',
  oil: 'Oil',
};

// Extended types with relations (used in detail views)
export interface ModelWithRelations extends Model {
  variants?: Variant[];
  manuals?: ManualWithVariants[];
}

export interface ManualWithVariants extends Manual {
  manual_variants?: { variant_id: string; variants: Variant }[];
}

export interface ManufacturerWithModels extends Manufacturer {
  models?: Model[];
}
