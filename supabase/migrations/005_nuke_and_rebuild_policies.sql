-- VibeProof Migration 005: Nuclear policy rebuild
-- Drops ALL policies on affected tables and recreates them cleanly.
-- ============================================================================

-- ─── USERS: drop every policy, rebuild ───────────────

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.users', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "users_select"
  ON public.users FOR SELECT
  USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY "users_insert"
  ON public.users FOR INSERT
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');

CREATE POLICY "users_update"
  ON public.users FOR UPDATE
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');

CREATE POLICY "users_delete"
  ON public.users FOR DELETE
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');


-- ─── USER_SOCIAL_LINKS: drop every policy, rebuild ───

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_social_links'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_social_links', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "social_links_select"
  ON public.user_social_links FOR SELECT
  USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

CREATE POLICY "social_links_insert"
  ON public.user_social_links FOR INSERT
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');

CREATE POLICY "social_links_update"
  ON public.user_social_links FOR UPDATE
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role')
  WITH CHECK ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');

CREATE POLICY "social_links_delete"
  ON public.user_social_links FOR DELETE
  USING ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role');


-- ─── QUEST_COMPLETIONS: drop every policy, rebuild ───

DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quest_completions') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quest_completions'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.quest_completions', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "qc_select" ON public.quest_completions FOR SELECT USING (auth.role() IN (''anon'', ''authenticated'', ''service_role''))';
    EXECUTE 'CREATE POLICY "qc_insert" ON public.quest_completions FOR INSERT WITH CHECK ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'')';
    EXECUTE 'CREATE POLICY "qc_update" ON public.quest_completions FOR UPDATE USING ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'') WITH CHECK ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'')';
    EXECUTE 'CREATE POLICY "qc_delete" ON public.quest_completions FOR DELETE USING ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'')';
  END IF;
END $$;


-- ─── QUEST_STATS: drop every policy, rebuild ─────────

DO $$
DECLARE pol RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quest_stats') THEN
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quest_stats'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.quest_stats', pol.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "qs_select" ON public.quest_stats FOR SELECT USING (auth.role() IN (''anon'', ''authenticated'', ''service_role''))';
    EXECUTE 'CREATE POLICY "qs_insert" ON public.quest_stats FOR INSERT WITH CHECK ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'')';
    EXECUTE 'CREATE POLICY "qs_update" ON public.quest_stats FOR UPDATE USING ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'') WITH CHECK ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'')';
    EXECUTE 'CREATE POLICY "qs_delete" ON public.quest_stats FOR DELETE USING ((current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''service_role'')';
  END IF;
END $$;
