import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Manufacturer, Model, Variant, Manual } from '../types/database';
import { formatGcNumber, stripGcDigits } from '../lib/gcNumber';

export interface ModelResult extends Model {
  manufacturers: Pick<Manufacturer, 'id' | 'name'>;
}

export interface VariantResult extends Variant {
  models: Pick<Model, 'id' | 'name'> & {
    manufacturers: Pick<Manufacturer, 'id' | 'name'>;
  };
}

export interface ManualResult extends Manual {
  models: Pick<Model, 'id' | 'name'> & {
    manufacturers: Pick<Manufacturer, 'id' | 'name'>;
  };
}

interface SearchState {
  query: string;
  manufacturers: Manufacturer[];
  models: ModelResult[];
  variants: VariantResult[];
  manuals: ManualResult[];
  loading: boolean;
  searched: boolean;
}

export const search$ = observable<SearchState>({
  query: '',
  manufacturers: [],
  models: [],
  variants: [],
  manuals: [],
  loading: false,
  searched: false,
});

export async function performSearch(query: string) {
  const trimmed = query.trim();
  search$.query.set(trimmed);

  if (!trimmed) {
    search$.manufacturers.set([]);
    search$.models.set([]);
    search$.variants.set([]);
    search$.manuals.set([]);
    search$.searched.set(false);
    return;
  }

  search$.loading.set(true);

  const pattern = `%${trimmed}%`;
  // GC numbers are stored with dashes (NN-NNN-NN). Reformat the digits in the
  // query so users can search with or without dashes.
  const digits = stripGcDigits(trimmed);
  const variantFilters = [`name.ilike.${pattern}`];
  if (digits) variantFilters.push(`gc_number.ilike.%${formatGcNumber(digits)}%`);

  const [mfrs, models, variants, manuals] = await Promise.all([
    supabase
      .from('manufacturers')
      .select('*')
      .ilike('name', pattern)
      .order('name')
      .limit(20),

    supabase
      .from('models')
      .select('*, manufacturers (id, name)')
      .ilike('name', pattern)
      .order('name')
      .limit(20),

    supabase
      .from('variants')
      .select('*, models (id, name, manufacturers (id, name))')
      .or(variantFilters.join(','))
      .order('name')
      .limit(20),

    supabase
      .from('manuals')
      .select('*, models (id, name, manufacturers (id, name))')
      .ilike('title', pattern)
      .order('title')
      .limit(20),
  ]);

  search$.manufacturers.set(mfrs.data ?? []);
  search$.models.set((models.data as ModelResult[]) ?? []);
  search$.variants.set((variants.data as VariantResult[]) ?? []);
  search$.manuals.set((manuals.data as ManualResult[]) ?? []);
  search$.searched.set(true);
  search$.loading.set(false);
}

export interface AutocompleteItem {
  key: string;
  type: 'manufacturer' | 'model' | 'variant' | 'manual';
  icon: string;
  label: string;
  sublabel?: string;
  gc?: string;
  to: string;
}

/**
 * Lightweight combined search for the header autocomplete dropdown.
 * Returns a flat, capped list of navigable results.
 */
export async function autocompleteSearch(query: string): Promise<AutocompleteItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = `%${trimmed}%`;
  const digits = stripGcDigits(trimmed);
  const variantFilters = [`name.ilike.${pattern}`];
  if (digits) variantFilters.push(`gc_number.ilike.%${formatGcNumber(digits)}%`);

  const [mfrs, models, variants, manuals] = await Promise.all([
    supabase.from('manufacturers').select('*').ilike('name', pattern).order('name').limit(5),
    supabase
      .from('models')
      .select('*, manufacturers (id, name)')
      .ilike('name', pattern)
      .order('name')
      .limit(5),
    supabase
      .from('variants')
      .select('*, models (id, name, manufacturers (id, name))')
      .or(variantFilters.join(','))
      .order('name')
      .limit(5),
    supabase
      .from('manuals')
      .select('*, models (id, name, manufacturers (id, name))')
      .ilike('title', pattern)
      .order('title')
      .limit(5),
  ]);

  const items: AutocompleteItem[] = [];

  for (const m of (mfrs.data ?? []) as Manufacturer[]) {
    items.push({ key: `mfr-${m.id}`, type: 'manufacturer', icon: '🏭', label: m.name, to: `/manufacturer/${m.id}` });
  }
  for (const m of (models.data as ModelResult[]) ?? []) {
    items.push({ key: `model-${m.id}`, type: 'model', icon: '📋', label: m.name, sublabel: m.manufacturers.name, to: `/model/${m.id}` });
  }
  for (const v of (variants.data as VariantResult[]) ?? []) {
    items.push({
      key: `variant-${v.id}`,
      type: 'variant',
      icon: '🔧',
      label: v.name,
      gc: v.gc_number,
      sublabel: `${v.models.manufacturers.name} › ${v.models.name}`,
      to: `/model/${v.model_id}`,
    });
  }
  for (const m of (manuals.data as ManualResult[]) ?? []) {
    items.push({
      key: `manual-${m.id}`,
      type: 'manual',
      icon: '📄',
      label: m.title,
      sublabel: `${m.models.manufacturers.name} › ${m.models.name}`,
      to: `/model/${m.model_id}`,
    });
  }

  return items;
}

export function clearSearch() {
  search$.query.set('');
  search$.manufacturers.set([]);
  search$.models.set([]);
  search$.variants.set([]);
  search$.manuals.set([]);
  search$.searched.set(false);
}
