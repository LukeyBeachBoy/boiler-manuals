export interface Manufacturer {
  id: string;
  name: string;
  created_at: string;
}

export interface Model {
  id: string;
  manufacturer_id: string;
  name: string;
  created_at: string;
}

export interface Variant {
  id: string;
  model_id: string;
  name: string;
  gc_number: string;
  created_at: string;
}

export interface Manual {
  id: string;
  model_id: string;
  title: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

export interface ManualVariant {
  manual_id: string;
  variant_id: string;
}

// Extended types with relations
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
