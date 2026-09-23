-- Supabase grants EXECUTE to anon directly via default privileges;
-- revoking only PUBLIC is not enough.
revoke execute on function public.is_directory_admin() from anon;
revoke execute on function public.save_manufacturer_directory(uuid,jsonb,jsonb,uuid[]) from anon;
