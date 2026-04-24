import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Variant, BoilerType, FuelType } from '../types/database';

interface VariantsState {
  items: Variant[];
  loading: boolean;
  error: string | null;
}

export const variants$ = observable<VariantsState>({
  items: [],
  loading: false,
  error: null,
});

export async function fetchVariantsByModel(modelId: string) {
  variants$.loading.set(true);
  variants$.error.set(null);

  const { data, error } = await supabase
    .from('variants')
    .select('*')
    .eq('model_id', modelId)
    .order('name');

  if (error) {
    variants$.error.set(error.message);
  } else {
    variants$.items.set(data);
  }

  variants$.loading.set(false);
}

export async function createVariant(
  modelId: string,
  name: string,
  gcNumber: string,
  boilerType: BoilerType | null,
  fuelType: FuelType | null,
): Promise<Variant | null> {
  const { data, error } = await supabase
    .from('variants')
    .insert({ model_id: modelId, name: name.trim(), gc_number: gcNumber.trim(), boiler_type: boilerType, fuel_type: fuelType })
    .select()
    .single();

  if (error) {
    variants$.error.set(error.message);
    return null;
  }

  variants$.items.set((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  return data;
}

export async function updateVariant(
  id: string,
  name: string,
  gcNumber: string,
  boilerType: BoilerType | null,
  fuelType: FuelType | null,
): Promise<boolean> {
  const { error } = await supabase
    .from('variants')
    .update({ name: name.trim(), gc_number: gcNumber.trim(), boiler_type: boilerType, fuel_type: fuelType })
    .eq('id', id);

  if (error) {
    variants$.error.set(error.message);
    return false;
  }

  variants$.items.set((prev) =>
    prev.map((v) => (v.id === id ? { ...v, name: name.trim(), gc_number: gcNumber.trim(), boiler_type: boilerType, fuel_type: fuelType } : v))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  return true;
}

export async function deleteVariant(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('variants')
    .delete()
    .eq('id', id);

  if (error) {
    variants$.error.set(error.message);
    return false;
  }

  variants$.items.set((prev) => prev.filter((v) => v.id !== id));
  return true;
}
