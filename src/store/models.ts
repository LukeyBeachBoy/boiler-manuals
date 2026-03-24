import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Model, ModelWithRelations } from '../types/database';

// Model enriched with aggregated manual count from Supabase join
type ModelWithManualCount = Model & { manuals: { count: number }[] };

interface ModelsState {
  items: ModelWithManualCount[];
  current: ModelWithRelations | null;
  loading: boolean;
  error: string | null;
}

export const models$ = observable<ModelsState>({
  items: [],
  current: null,
  loading: false,
  error: null,
});

export async function fetchModelsByManufacturer(manufacturerId: string) {
  models$.loading.set(true);
  models$.error.set(null);

  const { data, error } = await supabase
    .from('models')
    .select('*, manuals(count)')
    .eq('manufacturer_id', manufacturerId)
    .order('name');

  if (error) {
    models$.error.set(error.message);
  } else {
    models$.items.set(data);
  }

  models$.loading.set(false);
}

export async function fetchModelWithRelations(modelId: string) {
  models$.loading.set(true);
  models$.error.set(null);

  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      variants (*),
      manuals (
        *,
        manual_variants (
          variant_id,
          variants (*)
        )
      )
    `)
    .eq('id', modelId)
    .single();

  if (error) {
    models$.error.set(error.message);
  } else {
    models$.current.set(data as ModelWithRelations);
  }

  models$.loading.set(false);
}

export async function createModel(manufacturerId: string, name: string): Promise<Model | null> {
  const { data, error } = await supabase
    .from('models')
    .insert({ manufacturer_id: manufacturerId, name: name.trim() })
    .select()
    .single();

  if (error) {
    models$.error.set(error.message);
    return null;
  }

  models$.items.set((prev) => [...prev, { ...data, manuals: [{ count: 0 }] }].sort((a, b) => a.name.localeCompare(b.name)));
  return data;
}

export async function updateModel(id: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('models')
    .update({ name: name.trim() })
    .eq('id', id);

  if (error) {
    models$.error.set(error.message);
    return false;
  }

  models$.items.set((prev) =>
    prev.map((m) => (m.id === id ? { ...m, name: name.trim() } : m))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  return true;
}

export async function deleteModel(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('models')
    .delete()
    .eq('id', id);

  if (error) {
    models$.error.set(error.message);
    return false;
  }

  models$.items.set((prev) => prev.filter((m) => m.id !== id));
  return true;
}
