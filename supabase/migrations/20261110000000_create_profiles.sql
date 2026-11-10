-- Migration: Create Profiles Table, Security RLS, and Auth Trigger
-- Project: Teacher Fabian

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  english_level text CHECK (english_level IS NULL OR english_level IN ('B1', 'B2', 'C1')),
  preferred_schedule text,
  interest_topics text[] DEFAULT '{}'::text[],
  form_completed boolean NOT NULL DEFAULT false,
  accepted_respect_code boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = id)
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;
END $$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_full_name text;
  v_accepted_respect_code boolean;
  v_english_level text;
  v_interest_topics text[];
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  v_accepted_respect_code := COALESCE(
    (NEW.raw_user_meta_data->>'accepted_respect_code')::boolean,
    false
  );

  v_english_level := NEW.raw_user_meta_data->>'english_level';
  IF v_english_level IS NOT NULL AND v_english_level NOT IN ('B1', 'B2', 'C1') THEN
    v_english_level := NULL;
  END IF;

  IF NEW.raw_user_meta_data ? 'interest_topics' THEN
    SELECT COALESCE(ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'interest_topics')), '{}'::text[])
    INTO v_interest_topics;
  ELSE
    v_interest_topics := '{}'::text[];
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    english_level,
    interest_topics,
    accepted_respect_code,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    COALESCE(NEW.email, ''),
    v_english_level,
    COALESCE(v_interest_topics, '{}'::text[]),
    v_accepted_respect_code,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.profiles.email END,
    english_level = COALESCE(EXCLUDED.english_level, public.profiles.english_level),
    interest_topics = CASE WHEN EXCLUDED.interest_topics <> '{}'::text[] THEN EXCLUDED.interest_topics ELSE public.profiles.interest_topics END,
    accepted_respect_code = EXCLUDED.accepted_respect_code,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Revoke default public execution rights to prevent advisor security warnings
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
