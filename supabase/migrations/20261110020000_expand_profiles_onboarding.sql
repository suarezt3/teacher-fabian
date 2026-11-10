-- Migration: Expand profiles table for onboarding diagnostic form
-- Project: Teacher Fabian

-- 1. Update english_level CHECK constraint to allow A1, A2, B1, B2, C1, C2, NO_CONOZCO (and NULL)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_english_level_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_english_level_check
  CHECK (english_level IS NULL OR english_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NO_CONOZCO'));

-- 2. Add diagnostic and onboarding columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS country_city text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS education_level text,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS profession_area text,
  ADD COLUMN IF NOT EXISTS previous_study_type text,
  ADD COLUMN IF NOT EXISTS study_duration text,
  ADD COLUMN IF NOT EXISTS international_exam text,
  ADD COLUMN IF NOT EXISTS learning_goals text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS speaking_comfort text,
  ADD COLUMN IF NOT EXISTS previous_club_experience text,
  ADD COLUMN IF NOT EXISTS data_processing_authorized boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_authorized_at timestamptz,
  ADD COLUMN IF NOT EXISTS form_completed boolean NOT NULL DEFAULT false;

-- 3. Update handle_new_user() function to support expanded english_level set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_accepted_respect_code boolean;
  v_english_level text;
  v_interest_topics text[];
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  v_accepted_respect_code := COALESCE(
    (NEW.raw_user_meta_data->>'accepted_respect_code')::boolean,
    false
  );

  v_english_level := NEW.raw_user_meta_data->>'english_level';
  IF v_english_level IS NOT NULL AND v_english_level NOT IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NO_CONOZCO') THEN
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
    avatar_url,
    english_level,
    interest_topics,
    accepted_respect_code,
    form_completed,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_full_name,
    COALESCE(NEW.email, ''),
    v_avatar_url,
    v_english_level,
    COALESCE(v_interest_topics, '{}'::text[]),
    v_accepted_respect_code,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE public.profiles.email END,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    english_level = COALESCE(EXCLUDED.english_level, public.profiles.english_level),
    interest_topics = CASE WHEN EXCLUDED.interest_topics <> '{}'::text[] THEN EXCLUDED.interest_topics ELSE public.profiles.interest_topics END,
    accepted_respect_code = EXCLUDED.accepted_respect_code,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Revoke default public execution rights
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
