-- VibeProof Migration 003: Lock Down RLS Policies
-- Run this in Supabase SQL Editor AFTER 002_mission_engine.sql
--
-- PROBLEM: All tables had wide-open RLS policies (USING true / WITH CHECK true)
-- that allowed ANY anonymous user to INSERT, UPDATE, or DELETE any row.
-- This means someone with the anon key could:
--   - Change any user's XP, streak, rank
--   - Delete other users' social links
--   - Submit fake mission completions
--
-- FIX: Drop all overly permissive write policies.
-- Only SELECT remains public. All writes go through service_role or Edge Functions.
-- ============================================================================

-- ─── USERS TABLE ─────────────────────────────────────

-- Drop dangerous write policies
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- Add avatar_url column if missing (for leaderboard display)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Keep: SELECT is public (leaderboard)
-- Already exists: "users_select_policy" → USING (true) for SELECT ✅

-- New: Only service_role can insert users
CREATE POLICY "users_insert_service_only"
  ON public.users FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- New: Only service_role can update users
CREATE POLICY "users_update_service_only"
  ON public.users FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- New: Only service_role can delete users
CREATE POLICY "users_delete_service_only"
  ON public.users FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- ─── USER SOCIAL LINKS TABLE ─────────────────────────

-- Drop dangerous write policies
DROP POLICY IF EXISTS "Users can create own social links" ON user_social_links;
DROP POLICY IF EXISTS "Users can update own social links" ON user_social_links;
DROP POLICY IF EXISTS "Users can delete own social links" ON user_social_links;

-- Keep: SELECT is public ✅

-- New: Only service_role can insert
CREATE POLICY "social_links_insert_service_only"
  ON user_social_links FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- New: Only service_role can update
CREATE POLICY "social_links_update_service_only"
  ON user_social_links FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- New: Only service_role can delete
CREATE POLICY "social_links_delete_service_only"
  ON user_social_links FOR DELETE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- ─── COMPLETIONS TABLE (legacy from 000) ─────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'completions') THEN
    DROP POLICY IF EXISTS "completions_insert_policy" ON public.completions;
    DROP POLICY IF EXISTS "completions_update_policy" ON public.completions;

    CREATE POLICY "completions_insert_service_only"
      ON public.completions FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "completions_update_service_only"
      ON public.completions FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── MISSIONS TABLE (legacy from 000) ────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'missions') THEN
    DROP POLICY IF EXISTS "missions_admin_policy" ON public.missions;

    CREATE POLICY "missions_insert_service_only"
      ON public.missions FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "missions_update_service_only"
      ON public.missions FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── MISSION TEMPLATES TABLE ─────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_templates') THEN
    CREATE POLICY "templates_insert_service_only"
      ON public.mission_templates FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "templates_update_service_only"
      ON public.mission_templates FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── MISSION INSTANCES TABLE ─────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_instances') THEN
    DROP POLICY IF EXISTS "Allow mission instance generation" ON public.mission_instances;

    CREATE POLICY "instances_insert_service_only"
      ON public.mission_instances FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "instances_update_service_only"
      ON public.mission_instances FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── MISSION COMPLETIONS TABLE ───────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_completions') THEN
    DROP POLICY IF EXISTS "Users can submit completions" ON public.mission_completions;
    DROP POLICY IF EXISTS "Users can update own completions" ON public.mission_completions;

    CREATE POLICY "mission_completions_insert_service_only"
      ON public.mission_completions FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "mission_completions_update_service_only"
      ON public.mission_completions FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── QUEST COMPLETIONS TABLE (live DB) ───────────────
-- Exists in live database; fix overly permissive RLS

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quest_completions') THEN
    -- Drop any permissive write policies
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.quest_completions;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.quest_completions;
    DROP POLICY IF EXISTS "Enable delete for all users" ON public.quest_completions;
    DROP POLICY IF EXISTS "Allow insert" ON public.quest_completions;
    DROP POLICY IF EXISTS "Allow update" ON public.quest_completions;
    DROP POLICY IF EXISTS "Allow delete" ON public.quest_completions;
    DROP POLICY IF EXISTS "quest_completions_insert_policy" ON public.quest_completions;
    DROP POLICY IF EXISTS "quest_completions_update_policy" ON public.quest_completions;
    DROP POLICY IF EXISTS "quest_completions_delete_policy" ON public.quest_completions;

    -- Ensure RLS is enabled
    ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;

    -- Keep SELECT public, lock down writes
    CREATE POLICY "quest_completions_select_public"
      ON public.quest_completions FOR SELECT USING (true);
    CREATE POLICY "quest_completions_insert_service_only"
      ON public.quest_completions FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "quest_completions_update_service_only"
      ON public.quest_completions FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "quest_completions_delete_service_only"
      ON public.quest_completions FOR DELETE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── QUEST STATS TABLE (live DB) ─────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quest_stats') THEN
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.quest_stats;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.quest_stats;
    DROP POLICY IF EXISTS "Enable delete for all users" ON public.quest_stats;
    DROP POLICY IF EXISTS "Allow insert" ON public.quest_stats;
    DROP POLICY IF EXISTS "Allow update" ON public.quest_stats;
    DROP POLICY IF EXISTS "Allow delete" ON public.quest_stats;
    DROP POLICY IF EXISTS "quest_stats_insert_policy" ON public.quest_stats;
    DROP POLICY IF EXISTS "quest_stats_update_policy" ON public.quest_stats;
    DROP POLICY IF EXISTS "quest_stats_delete_policy" ON public.quest_stats;

    ALTER TABLE public.quest_stats ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "quest_stats_select_public"
      ON public.quest_stats FOR SELECT USING (true);
    CREATE POLICY "quest_stats_insert_service_only"
      ON public.quest_stats FOR INSERT
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "quest_stats_update_service_only"
      ON public.quest_stats FOR UPDATE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
      WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
    CREATE POLICY "quest_stats_delete_service_only"
      ON public.quest_stats FOR DELETE
      USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');
  END IF;
END $$;


-- ─── FIX FUNCTION SEARCH PATH (3 functions) ─────────

-- Fix: on_quest_completion_insert — set search_path to prevent path injection
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'on_quest_completion_insert') THEN
    ALTER FUNCTION public.on_quest_completion_insert() SET search_path = public;
  END IF;
END $$;

-- Fix: complete_quest — set search_path
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_quest') THEN
    EXECUTE format(
      'ALTER FUNCTION public.complete_quest(%s) SET search_path = public',
      (SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'complete_quest' LIMIT 1)
    );
  END IF;
END $$;

-- Fix: increment_quest_completion_count — set search_path
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_quest_completion_count') THEN
    EXECUTE format(
      'ALTER FUNCTION public.increment_quest_completion_count(%s) SET search_path = public',
      (SELECT pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'increment_quest_completion_count' LIMIT 1)
    );
  END IF;
END $$;


-- ─── FIX SEARCH PATH for our migration functions too ──

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_rank') THEN
    ALTER FUNCTION public.get_user_rank(text) SET search_path = public;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_user_xp') THEN
    ALTER FUNCTION public.add_user_xp(text, integer) SET search_path = public;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_daily_missions') THEN
    ALTER FUNCTION public.generate_daily_missions() SET search_path = public;
  END IF;
END $$;


-- ─── STORAGE: avatars bucket ─────────────────────────
-- If the avatars bucket exists, lock it down too.
-- Only service_role should upload; public reads are fine.
-- (Run this in Dashboard > Storage > Policies if bucket exists)


-- ─── EDGE FUNCTION: sync_user ────────────────────────
-- The app now calls this function instead of writing directly.
-- See supabase/functions/sync-user/index.ts for implementation.
-- Deploy with: supabase functions deploy sync-user


-- ============================================================================
-- SUMMARY OF CHANGES:
-- ✅ SELECT on all tables: public (for leaderboard, profiles, missions)
-- 🔒 INSERT on all tables: service_role only
-- 🔒 UPDATE on all tables: service_role only
-- 🔒 DELETE on all tables: service_role only
-- 🔒 quest_completions: locked down (was USING true)
-- 🔒 quest_stats: locked down (was USING true)
-- 🔒 3 quest functions: search_path set to 'public'
-- 🔒 3 migration functions: search_path set to 'public'
--
-- The app's anon key can READ everything but WRITE nothing.
-- All writes go through the sync-user Edge Function which uses service_role.
-- ============================================================================
