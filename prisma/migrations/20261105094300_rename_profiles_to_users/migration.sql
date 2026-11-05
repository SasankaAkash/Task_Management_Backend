-- 1. Rename profiles -> users; IF EXISTS also allows rerunning after the rename.
ALTER TABLE IF EXISTS public.profiles RENAME TO users;

-- 2. Sync function (the body is only checked when it runs, so it is safe on the shadow DB)
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.users AS existing_user (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, existing_user.full_name),
      updated_at = pg_catalog.now();
  RETURN NEW;
END;
$function$;

-- 3. Trigger + backfill: only where the auth schema exists (real Supabase)
DO $auth_sync$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS auth_user_to_public_users ON auth.users;

    CREATE TRIGGER auth_user_to_public_users
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_auth_user_to_public_users();

    INSERT INTO public.users AS existing_user (id, email, full_name)
    SELECT id, email, raw_user_meta_data ->> 'full_name'
    FROM auth.users
    WHERE email IS NOT NULL
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, existing_user.full_name);
  END IF;
END;
$auth_sync$;

-- 4. RLS works everywhere
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Grants and policy: only where the Supabase roles and auth.uid() exist
DO $rls$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public.users FROM anon, authenticated;
    GRANT SELECT ON TABLE public.users TO authenticated;

    DROP POLICY IF EXISTS users_select_own ON public.users;

    IF to_regprocedure('auth.uid()') IS NOT NULL THEN
      CREATE POLICY users_select_own
      ON public.users
      FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = id);
    END IF;
  END IF;
END;
$rls$;