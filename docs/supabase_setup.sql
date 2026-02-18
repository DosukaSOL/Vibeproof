/**
 * VibeProof - Supabase Database Setup
 * 
 * This file contains all the SQL required to set up VibeProof's backend.
 * Execute these commands in your Supabase SQL Editor.
 * 
 * Prerequisites:
 * - Supabase project created
 * - You have access to the SQL Editor
 */

-- =====================
-- USERS TABLE
-- =====================
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  wallet text not null unique,
  username text unique,
  xp integer default 0 not null,
  streak integer default 0 not null,
  rank integer default 0 not null,
  level integer default 1 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Index for common queries
create index if not exists users_wallet_idx on users(wallet);
create index if not exists users_username_idx on users(username);
create index if not exists users_xp_idx on users(xp desc);

-- Enable RLS
alter table public.users enable row level security;

-- Anyone can read user profiles
create policy "users_select_policy"
  on public.users
  for select
  using (true);

-- Only service_role can write users
create policy "users_insert_service_only"
  on public.users
  for insert
  with check (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

create policy "users_update_service_only"
  on public.users
  for update
  using (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  with check (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

create policy "users_delete_service_only"
  on public.users
  for delete
  using (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =====================
-- MISSIONS TABLE
-- =====================
create table if not exists public.missions (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  mission_type text not null check (mission_type in ('follow', 'post', 'join', 'verify')),
  target_url text,
  xp_reward integer default 100 not null,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Index for common queries
create index if not exists missions_active_idx on missions(active) where active = true;

-- Enable RLS
alter table public.missions enable row level security;

-- Anyone can view active missions
create policy "missions_select_policy"
  on public.missions
  for select
  using (active = true);

-- Only service_role can write missions
create policy "missions_insert_service_only"
  on public.missions
  for insert
  with check (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =====================
-- MISSION COMPLETIONS TABLE
-- =====================
create table if not exists public.completions (
  id uuid default gen_random_uuid() primary key,
  user_wallet text not null references users(wallet) on delete cascade,
  mission_id uuid not null references missions(id) on delete cascade,
  proof text not null,
  verified boolean default false not null,
  created_at timestamp with time zone default now() not null,
  verified_at timestamp with time zone,
  unique(user_wallet, mission_id)
);

-- Indexes
create index if not exists completions_wallet_idx on completions(user_wallet);
create index if not exists completions_mission_idx on completions(mission_id);
create index if not exists completions_verified_idx on completions(verified);

-- Enable RLS
alter table public.completions enable row level security;

-- Users can see all completions
create policy "completions_select_policy"
  on public.completions
  for select
  using (true);

-- Only service_role can write completions
create policy "completions_insert_service_only"
  on public.completions
  for insert
  with check (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );

create policy "completions_update_service_only"
  on public.completions
  for update
  using (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  )
  with check (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  );


-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Get a user's rank based on XP
create or replace function public.get_user_rank(p_wallet text)
returns bigint as $$
  select count(*) + 1
  from public.users
  where xp > (select xp from public.users where wallet = p_wallet)
$$ language sql stable;

-- Update user XP and rank (call this after mission completion)
create or replace function public.add_user_xp(p_wallet text, p_xp integer)
returns void as $$
begin
  update public.users
  set xp = xp + p_xp,
      rank = (select count(*) + 1 from public.users u where u.xp > users.xp)
  where wallet = p_wallet;
end;
$$ language plpgsql;


-- =====================
-- SAMPLE DATA (optional)
-- =====================

-- Insert sample mission (uncomment to use)
-- insert into public.missions (title, description, mission_type, xp_reward)
-- values 
--   ('Follow on Twitter', 'Follow us on Twitter', 'follow', 100),
--   ('Join Discord', 'Join our Discord server', 'join', 150),
--   ('Create a post', 'Share about VibeProof', 'post', 200);
