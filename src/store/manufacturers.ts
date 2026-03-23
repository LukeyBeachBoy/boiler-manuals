import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Manufacturer } from '../types/database';

interface ManufacturersState {
  items: Manufacturer[];
  loading: boolean;
  error: string | null;
}

export const manufacturers$ = observable<ManufacturersState>({
  items: [],
  loading: false,
  error: null,
});

export async function fetchManufacturers() {
  manufacturers$.loading.set(true);
  manufacturers$.error.set(null);

  const { data, error } = await supabase
    .from('manufacturers')
    .select('*')
    .order('name');

  if (error) {
    manufacturers$.error.set(error.message);
  } else {
    manufacturers$.items.set(data);
  }

  manufacturers$.loading.set(false);
}

export async function createManufacturer(name: string): Promise<Manufacturer | null> {
  const { data, error } = await supabase
    .from('manufacturers')
    .insert({ name: name.trim() })
    .select()
    .single();

  if (error) {
    manufacturers$.error.set(error.message);
    return null;
  }

  manufacturers$.items.set((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  return data;
}

export async function updateManufacturer(id: string, name: string): Promise<boolean> {
  const { error } = await supabase
    .from('manufacturers')
    .update({ name: name.trim() })
    .eq('id', id);

  if (error) {
    manufacturers$.error.set(error.message);
    return false;
  }

  manufacturers$.items.set((prev) =>
    prev.map((m) => (m.id === id ? { ...m, name: name.trim() } : m))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
  return true;
}

export async function deleteManufacturer(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('manufacturers')
    .delete()
    .eq('id', id);

  if (error) {
    manufacturers$.error.set(error.message);
    return false;
  }

  manufacturers$.items.set((prev) => prev.filter((m) => m.id !== id));
  return true;
}
