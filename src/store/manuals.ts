import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { Manual } from '../types/database';

interface ManualsState {
  items: Manual[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

export const manuals$ = observable<ManualsState>({
  items: [],
  loading: false,
  uploading: false,
  error: null,
});

export async function fetchManualsByModel(modelId: string) {
  manuals$.loading.set(true);
  manuals$.error.set(null);

  const { data, error } = await supabase
    .from('manuals')
    .select(`
      *,
      manual_variants (
        variant_id,
        variants (id, name, gc_number)
      )
    `)
    .eq('model_id', modelId)
    .order('title');

  if (error) {
    manuals$.error.set(error.message);
  } else {
    manuals$.items.set(data);
  }

  manuals$.loading.set(false);
}

export async function uploadManual(
  modelId: string,
  title: string,
  file: File,
  variantIds: string[]
): Promise<Manual | null> {
  manuals$.uploading.set(true);
  manuals$.error.set(null);

  // Upload file to storage
  const filePath = `${modelId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('manuals')
    .upload(filePath, file);

  if (uploadError) {
    manuals$.error.set(uploadError.message);
    manuals$.uploading.set(false);
    return null;
  }

  // Create manual record
  const { data: manual, error: insertError } = await supabase
    .from('manuals')
    .insert({
      model_id: modelId,
      title: title.trim(),
      file_path: filePath,
      file_size: file.size,
    })
    .select()
    .single();

  if (insertError) {
    manuals$.error.set(insertError.message);
    manuals$.uploading.set(false);
    return null;
  }

  // Link variants
  if (variantIds.length > 0) {
    const links = variantIds.map((variant_id) => ({
      manual_id: manual.id,
      variant_id,
    }));

    const { error: linkError } = await supabase
      .from('manual_variants')
      .insert(links);

    if (linkError) {
      manuals$.error.set(linkError.message);
    }
  }

  manuals$.uploading.set(false);
  await fetchManualsByModel(modelId);
  return manual;
}

export async function deleteManual(manual: Manual): Promise<boolean> {
  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('manuals')
    .remove([manual.file_path]);

  if (storageError) {
    manuals$.error.set(storageError.message);
    return false;
  }

  // Delete record (junction table entries cascade)
  const { error } = await supabase
    .from('manuals')
    .delete()
    .eq('id', manual.id);

  if (error) {
    manuals$.error.set(error.message);
    return false;
  }

  manuals$.items.set((prev) => prev.filter((m) => m.id !== manual.id));
  return true;
}

export async function updateManualTitle(id: string, title: string): Promise<boolean> {
  const { error } = await supabase
    .from('manuals')
    .update({ title: title.trim() })
    .eq('id', id);

  if (error) {
    manuals$.error.set(error.message);
    return false;
  }

  manuals$.items.set((prev) =>
    prev.map((m) => (m.id === id ? { ...m, title: title.trim() } : m))
  );
  return true;
}

export function getManualDownloadUrl(filePath: string): string {
  const { data } = supabase.storage.from('manuals').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getManualSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('manuals')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    manuals$.error.set(error.message);
    return null;
  }

  return data.signedUrl;
}
