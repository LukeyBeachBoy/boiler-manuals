import { supabase } from './supabase';

/** Supports official manufacturer assets as well as uploaded bucket objects. */
export function manufacturerLogoUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https:\/\//i.test(path)) return path;
  return supabase.storage.from('manufacturer-logos').getPublicUrl(path).data.publicUrl;
}

export function isUploadedManufacturerLogo(path: string | null): path is string {
  return !!path && !/^https:\/\//i.test(path);
}
