-- VibeProof Database Migration: Mission Engine
-- Run this in Supabase SQL Editor AFTER 001_user_social_links.sql

-- ─── mission_templates table ─────────────────────────
-- Templates define what kinds of missions exist.
-- Instances are generated from these daily/weekly.
CREATE TABLE IF NOT EXISTS mission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Category: 'repeatable' or 'one_time'
  category TEXT NOT NULL DEFAULT 'repeatable' 
    CHECK (category IN ('repeatable', 'one_time')),
  
  -- Verification type
  verification_type TEXT NOT NULL 
    CHECK (verification_type IN (
      'on_chain_tx',        -- Had any transaction
      'on_chain_balance',   -- Hold minimum SOL
      'on_chain_program',   -- Interacted with specific program
      'on_chain_transfer',  -- Sent a transfer
      'x_post_hashtag',     -- Posted tweet with hashtag
      'x_reply',            -- Replied to specific tweet
      'x_follow',           -- Followed specific account
      'manual',             -- Manual proof submission
      'app_action'          -- In-app action (link X, set username, etc.)
    )),
  
  -- JSON config for verification parameters
  -- e.g. { "min_balance": 0.1 } or { "hashtag": "#VibeProof", "program_id": "..." }
  verification_config JSONB NOT NULL DEFAULT '{}',
  
  -- Recurrence: 'daily', 'weekly', 'one_time'
  recurrence TEXT NOT NULL DEFAULT 'daily'
    CHECK (recurrence IN ('daily', 'weekly', 'one_time')),
  
  xp_reward INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── mission_instances table ─────────────────────────
-- Generated daily/weekly from templates. Users complete instances.
CREATE TABLE IF NOT EXISTS mission_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES mission_templates(id) ON DELETE CASCADE,
  
  -- Period identifier: e.g. '2026-02-16' for daily, '2026-W08' for weekly
  period TEXT NOT NULL,
  
  -- Denormalized from template for fast reads
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  verification_type TEXT NOT NULL,
  verification_config JSONB NOT NULL DEFAULT '{}',
  xp_reward INTEGER NOT NULL DEFAULT 100,
  category TEXT NOT NULL DEFAULT 'repeatable',
  
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate instances per template per period
  CONSTRAINT unique_template_period UNIQUE (template_id, period)
);

-- ─── mission_completions table ───────────────────────
-- Tracks user completions with verification data
CREATE TABLE IF NOT EXISTS mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  
  -- Can reference either an instance or a template (for one-time)
  mission_instance_id UUID REFERENCES mission_instances(id) ON DELETE SET NULL,
  mission_template_id UUID REFERENCES mission_templates(id) ON DELETE SET NULL,
  
  -- Verification status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verifying', 'verified', 'failed', 'expired')),
  
  -- Proof data (tx signature, tweet URL, screenshot URL, etc.)
  proof_data JSONB NOT NULL DEFAULT '{}',
  
  -- Verification result data
  verification_result JSONB,
  
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to users
  CONSTRAINT fk_completion_wallet FOREIGN KEY (user_wallet) 
    REFERENCES users(wallet) ON DELETE CASCADE
);

-- ─── Unique constraint for one-time missions ─────────
-- Each user can only complete a one-time template once
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_onetime_completion
  ON mission_completions(user_wallet, mission_template_id) 
  WHERE mission_template_id IS NOT NULL AND status IN ('verified', 'verifying', 'pending');

-- ─── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_instances_period 
  ON mission_instances(period, active);
CREATE INDEX IF NOT EXISTS idx_instances_template 
  ON mission_instances(template_id);
CREATE INDEX IF NOT EXISTS idx_completions_wallet 
  ON mission_completions(user_wallet, status);
CREATE INDEX IF NOT EXISTS idx_completions_instance 
  ON mission_completions(mission_instance_id);
CREATE INDEX IF NOT EXISTS idx_templates_category 
  ON mission_templates(category, active);

-- ─── RLS Policies ─────────────────────────────────────
ALTER TABLE mission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;

-- Templates: read-only for everyone
CREATE POLICY "Templates are viewable by everyone" 
  ON mission_templates FOR SELECT USING (true);

-- Instances: read-only for everyone
CREATE POLICY "Instances are viewable by everyone" 
  ON mission_instances FOR SELECT USING (true);

-- Completions: anyone can read, only service_role can write
CREATE POLICY "Completions are viewable by everyone" 
  ON mission_completions FOR SELECT USING (true);

CREATE POLICY "mission_completions_insert_service_only" 
  ON mission_completions FOR INSERT 
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

CREATE POLICY "mission_completions_update_service_only" 
  ON mission_completions FOR UPDATE 
  USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- Only service_role can generate mission instances
CREATE POLICY "instances_insert_service_only" 
  ON mission_instances FOR INSERT 
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

-- ─── Seed mission templates ──────────────────────────
INSERT INTO mission_templates (title, description, category, verification_type, verification_config, recurrence, xp_reward, sort_order) VALUES

-- On-chain: daily
('Daily Transaction', 'Make any on-chain Solana transaction today', 'repeatable', 'on_chain_tx', '{"window_hours": 24}', 'daily', 100, 1),
('Hold SOL', 'Hold at least 0.1 SOL in your wallet', 'repeatable', 'on_chain_balance', '{"min_balance": 0.1}', 'daily', 50, 2),

-- X missions: daily
('Tweet #VibeProof', 'Post a tweet with #VibeProof and your wallet suffix', 'repeatable', 'x_post_hashtag', '{"hashtag": "#VibeProof", "require_wallet_suffix": true}', 'daily', 150, 3),
('Follow @VibeProofApp', 'Follow the official VibeProof account on X', 'repeatable', 'x_follow', '{"target_username": "VibeProofApp"}', 'weekly', 100, 4),

-- One-time missions
('Link X Account', 'Connect your X (Twitter) account to your profile', 'one_time', 'app_action', '{"action": "link_x"}', 'one_time', 200, 10),
('Set Username', 'Choose a username for your VibeProof profile', 'one_time', 'app_action', '{"action": "set_username"}', 'one_time', 100, 11),
('First Connect', 'Connect your Solana wallet for the first time', 'one_time', 'app_action', '{"action": "first_connect"}', 'one_time', 150, 12)

ON CONFLICT DO NOTHING;

-- ─── Function: Generate mission instances for today ──
CREATE OR REPLACE FUNCTION generate_daily_missions()
RETURNS INTEGER AS $$
DECLARE
  today TEXT;
  week TEXT;
  generated INTEGER := 0;
  tmpl RECORD;
BEGIN
  today := TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
  week := TO_CHAR(CURRENT_DATE, 'IYYY-"W"IW');
  
  -- Generate daily mission instances
  FOR tmpl IN 
    SELECT * FROM mission_templates 
    WHERE active = true AND recurrence = 'daily'
  LOOP
    INSERT INTO mission_instances (
      template_id, period, title, description, 
      verification_type, verification_config, xp_reward, category,
      starts_at, expires_at
    ) VALUES (
      tmpl.id, today, tmpl.title, tmpl.description,
      tmpl.verification_type, tmpl.verification_config, tmpl.xp_reward, tmpl.category,
      CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day'
    ) ON CONFLICT (template_id, period) DO NOTHING;
    
    generated := generated + 1;
  END LOOP;
  
  -- Generate weekly mission instances
  FOR tmpl IN 
    SELECT * FROM mission_templates 
    WHERE active = true AND recurrence = 'weekly'
  LOOP
    INSERT INTO mission_instances (
      template_id, period, title, description, 
      verification_type, verification_config, xp_reward, category,
      starts_at, expires_at
    ) VALUES (
      tmpl.id, week, tmpl.title, tmpl.description,
      tmpl.verification_type, tmpl.verification_config, tmpl.xp_reward, tmpl.category,
      DATE_TRUNC('week', CURRENT_DATE), DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
    ) ON CONFLICT (template_id, period) DO NOTHING;
    
    generated := generated + 1;
  END LOOP;
  
  RETURN generated;
END;
$$ LANGUAGE plpgsql;
