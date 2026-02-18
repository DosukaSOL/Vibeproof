-- VibeProof Database Migration: User Social Links
-- Run this in Supabase SQL Editor

-- ─── user_social_links table ─────────────────────────
CREATE TABLE IF NOT EXISTS user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  provider TEXT NOT NULL,  -- 'x', 'discord', etc.
  provider_user_id TEXT NOT NULL,
  provider_username TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refresh TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each user can only link one account per provider
  CONSTRAINT unique_user_provider UNIQUE (user_wallet, provider),
  -- Each provider account can only be linked to one wallet
  CONSTRAINT unique_provider_account UNIQUE (provider, provider_user_id),
  -- Foreign key to users table
  CONSTRAINT fk_user_wallet FOREIGN KEY (user_wallet) 
    REFERENCES users(wallet) ON DELETE CASCADE
);

-- ─── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_links_wallet 
  ON user_social_links(user_wallet);
CREATE INDEX IF NOT EXISTS idx_social_links_provider 
  ON user_social_links(provider, provider_user_id);

-- ─── RLS Policies ─────────────────────────────────────
ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read social links (public leaderboard context)
CREATE POLICY "Social links are viewable by everyone" 
  ON user_social_links FOR SELECT 
  USING (true);

-- Only service_role can write social links
CREATE POLICY "social_links_insert_service_only" 
  ON user_social_links FOR INSERT 
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "social_links_update_service_only" 
  ON user_social_links FOR UPDATE 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "social_links_delete_service_only" 
  ON user_social_links FOR DELETE 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );
