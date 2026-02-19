-- VibeProof Migration 006: Allow anon user sync
-- ============================================================================
-- The sync-user Edge Function was never deployed, so user profiles never
-- reached the Supabase `users` table → leaderboard was empty.
--
-- Fix: Allow anon/authenticated roles to INSERT and UPDATE on `users`,
-- so the app can sync profiles directly with the anon key.
-- DELETE remains service_role only (nobody can delete users from the app).
-- ============================================================================

-- Drop existing INSERT/UPDATE policies
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;

-- Allow all roles to INSERT (new users registering)
CREATE POLICY "users_insert"
  ON public.users FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- Allow all roles to UPDATE (syncing XP, username, avatar, etc.)
CREATE POLICY "users_update"
  ON public.users FOR UPDATE
  USING (auth.role() IN ('anon', 'authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- ─── user_social_links: same treatment ─────────────────
DROP POLICY IF EXISTS "social_links_insert" ON public.user_social_links;
DROP POLICY IF EXISTS "social_links_update" ON public.user_social_links;
DROP POLICY IF EXISTS "social_links_delete" ON public.user_social_links;

CREATE POLICY "social_links_insert"
  ON public.user_social_links FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY "social_links_update"
  ON public.user_social_links FOR UPDATE
  USING (auth.role() IN ('anon', 'authenticated', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY "social_links_delete"
  ON public.user_social_links FOR DELETE
  USING (auth.role() IN ('anon', 'authenticated', 'service_role'));
