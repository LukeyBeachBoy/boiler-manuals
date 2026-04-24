import type { Tables } from './supabase';

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

// Base types derived from generated Supabase schema, augmented with new columns
export type Manufacturer = Tables<'manufacturers'>;
export type Model = Tables<'models'> & {
  boiler_type: BoilerType | null;
  fuel_type: FuelType | null;
};
export type Variant = Tables<'variants'> & {
  boiler_type: BoilerType | null;
  fuel_type: FuelType | null;
};
export type Manual = Tables<'manuals'>;
export type ManualVariant = Tables<'manual_variants'>;

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
