-- Restore the internal user mirror from existing Supabase Auth users.
-- This backfills profiles and ensures all existing users are admins.

INSERT INTO public.profiles (user_id, display_name, avatar_url, created_at, updated_at)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data ->> 'display_name'), ''), u.email),
  NULL,
  now(),
  now()
FROM auth.users u
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  updated_at = EXCLUDED.updated_at;

DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users);

INSERT INTO public.user_roles (user_id, role)
SELECT
  u.id,
  'admin'::public.app_role
FROM auth.users u;
