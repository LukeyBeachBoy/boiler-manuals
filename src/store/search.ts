import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Manufacturer, Model, Variant, Manual } from '../types/database';

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
      .or(`name.ilike.${pattern},gc_number.ilike.${pattern}`)
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

export function clearSearch() {
  search$.query.set('');
  search$.manufacturers.set([]);
  search$.models.set([]);
  search$.variants.set([]);
  search$.manuals.set([]);
  search$.searched.set(false);
}
