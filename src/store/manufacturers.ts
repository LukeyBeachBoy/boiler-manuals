import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import { isUploadedManufacturerLogo } from '../lib/manufacturerLogo';
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
  // Capture storage paths before the database cascade removes the records.
  const [manuals, manufacturer] = await Promise.all([
    supabase.from('manuals').select('file_path, models!inner(manufacturer_id)').eq('models.manufacturer_id', id),
    supabase.from('manufacturers').select('logo_path').eq('id', id).single(),
  ]);
  if (manuals.error || manufacturer.error) {
    manufacturers$.error.set(manuals.error?.message ?? manufacturer.error?.message ?? 'Could not load files.');
    return false;
  }
  const { error } = await supabase
    .from('manufacturers')
    .delete()
    .eq('id', id);

  if (error) {
    manufacturers$.error.set(error.message);
    return false;
  }

  manufacturers$.items.set((prev) => prev.filter((m) => m.id !== id));
  const paths = (manuals.data ?? []).map((manual) => manual.file_path);
  for (let i = 0; i < paths.length; i += 100) {
    const cleanup = await supabase.storage.from('manuals').remove(paths.slice(i, i + 100));
    if (cleanup.error) manufacturers$.error.set('Manufacturer deleted, but some PDF files need cleanup: ' + cleanup.error.message);
  }
  if (isUploadedManufacturerLogo(manufacturer.data?.logo_path ?? null)) {
    const cleanup = await supabase.storage.from('manufacturer-logos').remove([manufacturer.data.logo_path]);
    if (cleanup.error) manufacturers$.error.set('Manufacturer deleted, but its logo needs cleanup: ' + cleanup.error.message);
  }
  return true;
}
