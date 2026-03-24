import type { Tables } from './supabase';

// Base types derived from generated Supabase schema
export type Manufacturer = Tables<'manufacturers'>;
export type Model = Tables<'models'>;
export type Variant = Tables<'variants'>;
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
