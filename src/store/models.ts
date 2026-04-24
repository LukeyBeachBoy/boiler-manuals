import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Model, ModelWithRelations, BoilerType, FuelType } from '../types/database';

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
    models$.items.set(data as unknown as ModelWithManualCount[]);
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

export async function createModel(
  manufacturerId: string,
  name: string,
  boilerType: BoilerType | null,
  fuelType: FuelType | null,
): Promise<Model | null> {
  const { data, error } = await supabase
    .from('models')
    .insert({ manufacturer_id: manufacturerId, name: name.trim(), boiler_type: boilerType, fuel_type: fuelType })
    .select()
    .single();

  if (error) {
    models$.error.set(error.message);
    return null;
  }

  models$.items.set((prev) => [...prev, { ...data as unknown as Model, manuals: [{ count: 0 }] }].sort((a, b) => a.name.localeCompare(b.name)));
  return data as unknown as Model;
}

export async function updateModel(
  id: string,
  name: string,
  boilerType: BoilerType | null,
  fuelType: FuelType | null,
): Promise<boolean> {
  const { error } = await supabase
    .from('models')
    .update({ name: name.trim(), boiler_type: boilerType, fuel_type: fuelType })
    .eq('id', id);

  if (error) {
    models$.error.set(error.message);
    return false;
  }

  models$.items.set((prev) =>
    prev.map((m) => (m.id === id ? { ...m, name: name.trim(), boiler_type: boilerType, fuel_type: fuelType } : m))
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
