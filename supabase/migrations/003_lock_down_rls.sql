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

DROP POLICY IF EXISTS "completions_insert_policy" ON public.completions;
DROP POLICY IF EXISTS "completions_update_policy" ON public.completions;

-- Keep: SELECT is public ✅

CREATE POLICY "completions_insert_service_only"
  ON public.completions FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "completions_update_service_only"
  ON public.completions FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- ─── MISSIONS TABLE (legacy from 000) ────────────────

DROP POLICY IF EXISTS "missions_admin_policy" ON public.missions;

-- Keep: SELECT for active missions only ✅

CREATE POLICY "missions_insert_service_only"
  ON public.missions FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "missions_update_service_only"
  ON public.missions FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- ─── MISSION TEMPLATES TABLE ─────────────────────────

-- Keep: SELECT is public ✅
-- No write policy for anon should exist; add service_role only

CREATE POLICY "templates_insert_service_only"
  ON mission_templates FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "templates_update_service_only"
  ON mission_templates FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- ─── MISSION INSTANCES TABLE ─────────────────────────

DROP POLICY IF EXISTS "Allow mission instance generation" ON mission_instances;

-- Keep: SELECT is public ✅

CREATE POLICY "instances_insert_service_only"
  ON mission_instances FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "instances_update_service_only"
  ON mission_instances FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- ─── MISSION COMPLETIONS TABLE ───────────────────────

DROP POLICY IF EXISTS "Users can submit completions" ON mission_completions;
DROP POLICY IF EXISTS "Users can update own completions" ON mission_completions;

-- Keep: SELECT is public ✅

CREATE POLICY "mission_completions_insert_service_only"
  ON mission_completions FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "mission_completions_update_service_only"
  ON mission_completions FOR UPDATE
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


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
--
-- The app's anon key can READ everything but WRITE nothing.
-- All writes go through the sync-user Edge Function which uses service_role.
-- ============================================================================
