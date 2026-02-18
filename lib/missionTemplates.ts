/**
 * Mission Templates — hardcoded missions for daily rotation, one-time & weekly.
 * Daily missions rotate automatically based on the day of year.
 * Weekly challenges rotate every Monday.
 * No Supabase dependency — works fully offline.
 */

export type MissionTag = "on-chain" | "social" | "app" | "defi" | "github";

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  verification_type: string;
  verification_config: Record<string, any>;
  xp_reward: number;
  icon: string;
  requires_social?: string;
  tag: MissionTag;
}

/** Category metadata for display */
export const MISSION_TAG_META: Record<
  MissionTag,
  { label: string; color: string; bg: string; icon: string }
> = {
  "on-chain": {
    label: "On-Chain",
    color: "#58A6FF",
    bg: "rgba(88, 166, 255, 0.12)",
    icon: "⛓️",
  },
  social: {
    label: "Social",
    color: "#BC8CFF",
    bg: "rgba(188, 140, 255, 0.12)",
    icon: "💬",
  },
  app: {
    label: "App",
    color: "#3FB950",
    bg: "rgba(63, 185, 80, 0.12)",
    icon: "📱",
  },
  defi: {
    label: "DeFi",
    color: "#F0883E",
    bg: "rgba(240, 136, 62, 0.12)",
    icon: "💰",
  },
  github: {
    label: "GitHub",
    color: "#E1E4E8",
    bg: "rgba(225, 228, 232, 0.12)",
    icon: "🐙",
  },
};

// ─── Daily Mission Pool (15 missions — rotate each day) ─

const DAILY_POOL: MissionTemplate[] = [
  {
    id: "daily_tx",
    title: "Make a Solana Transaction",
    description: "Send any transaction on Solana mainnet in the last 24 hours",
    category: "daily",
    verification_type: "on_chain_tx",
    verification_config: { window_hours: 24 },
    xp_reward: 100,
    icon: "⛓️",
    tag: "on-chain",
  },
  {
    id: "daily_balance",
    title: "HODL Check",
    description: "Verify you're holding at least 0.01 SOL in your wallet",
    category: "daily",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.01 },
    xp_reward: 50,
    icon: "💰",
    tag: "defi",
  },
  {
    id: "daily_checkin",
    title: "Daily Check-in",
    description: "Open VibeProof and check in today — easy XP!",
    category: "daily",
    verification_type: "app_action",
    verification_config: { action: "daily_checkin" },
    xp_reward: 25,
    icon: "📱",
    tag: "app",
  },
  {
    id: "daily_explore",
    title: "Explore Solana",
    description: "Interact with any Solana dApp or DEX today",
    category: "daily",
    verification_type: "on_chain_tx",
    verification_config: { window_hours: 24 },
    xp_reward: 100,
    icon: "🌐",
    tag: "defi",
  },
  {
    id: "daily_transfer",
    title: "Send SOL",
    description: "Make a SOL transfer to any wallet",
    category: "daily",
    verification_type: "on_chain_transfer",
    verification_config: { window_hours: 24 },
    xp_reward: 80,
    icon: "💸",
    tag: "on-chain",
  },
  // ─── New expanded daily missions ──────────────────────
  {
    id: "daily_nft_check",
    title: "NFT Portfolio Check",
    description: "Verify you hold at least one token in your wallet",
    category: "daily",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.001 },
    xp_reward: 40,
    icon: "🖼️",
    tag: "defi",
  },
  {
    id: "daily_defi_interact",
    title: "DeFi Interaction",
    description: "Make any on-chain interaction today",
    category: "daily",
    verification_type: "on_chain_tx",
    verification_config: { window_hours: 24 },
    xp_reward: 90,
    icon: "🔄",
    tag: "defi",
  },
  {
    id: "daily_swap",
    title: "Token Swap",
    description: "Perform any token transaction on Solana",
    category: "daily",
    verification_type: "on_chain_tx",
    verification_config: { window_hours: 24 },
    xp_reward: 110,
    icon: "🔀",
    tag: "on-chain",
  },
  {
    id: "daily_stake_check",
    title: "Staking Check",
    description: "Verify you're holding at least 0.05 SOL",
    category: "daily",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.05 },
    xp_reward: 60,
    icon: "🏦",
    tag: "defi",
  },
  {
    id: "daily_social_share",
    title: "Social Share",
    description: "Share your VibeProof stats today (manual verify)",
    category: "daily",
    verification_type: "app_action",
    verification_config: { action: "daily_checkin" },
    xp_reward: 35,
    icon: "📣",
    tag: "social",
  },
  {
    id: "daily_profile_visit",
    title: "Profile Visit",
    description: "Check your profile stats today",
    category: "daily",
    verification_type: "app_action",
    verification_config: { action: "daily_checkin" },
    xp_reward: 20,
    icon: "👤",
    tag: "app",
  },
  {
    id: "daily_leaderboard_check",
    title: "Leaderboard Check",
    description: "Check the leaderboard rankings today",
    category: "daily",
    verification_type: "app_action",
    verification_config: { action: "daily_checkin" },
    xp_reward: 20,
    icon: "🏆",
    tag: "app",
  },
  {
    id: "daily_wallet_check",
    title: "Wallet Health Check",
    description: "Verify your wallet is healthy with some SOL",
    category: "daily",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.005 },
    xp_reward: 30,
    icon: "🔍",
    tag: "on-chain",
  },
  {
    id: "daily_multi_tx",
    title: "Active Trader",
    description: "Make multiple transactions today",
    category: "daily",
    verification_type: "on_chain_tx",
    verification_config: { window_hours: 24 },
    xp_reward: 120,
    icon: "📊",
    tag: "on-chain",
  },
  {
    id: "daily_hodl_strong",
    title: "HODL Strong",
    description: "Maintain at least 0.1 SOL in your wallet",
    category: "daily",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.1 },
    xp_reward: 75,
    icon: "💪",
    tag: "defi",
  },
];

// ─── One-Time Missions ──────────────────────────────────

const ONE_TIME_MISSIONS: MissionTemplate[] = [
  {
    id: "ot_connect",
    title: "Connect Your Wallet",
    description: "Connect your Solana wallet for the first time",
    category: "one_time",
    verification_type: "app_action",
    verification_config: { action: "first_connect" },
    xp_reward: 200,
    icon: "🔗",
    tag: "app",
  },
  {
    id: "ot_username",
    title: "Set Your Username",
    description: "Choose a unique username for your VibeProof profile",
    category: "one_time",
    verification_type: "app_action",
    verification_config: { action: "set_username" },
    xp_reward: 100,
    icon: "✏️",
    tag: "app",
  },
  {
    id: "ot_avatar",
    title: "Upload Profile Photo",
    description: "Set a profile photo for your VibeProof identity",
    category: "one_time",
    verification_type: "app_action",
    verification_config: { action: "set_avatar" },
    xp_reward: 100,
    icon: "📸",
    tag: "app",
  },
  {
    id: "ot_link_x",
    title: "Link X Account",
    description: "Connect your X (Twitter) account to unlock social missions",
    category: "one_time",
    verification_type: "social_link",
    verification_config: { provider: "x" },
    xp_reward: 200,
    icon: "𝕏",
    tag: "social",
  },
  {
    id: "ot_diamond_hands",
    title: "Diamond Hands 💎",
    description: "Hold at least 0.1 SOL in your connected wallet",
    category: "one_time",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.1 },
    xp_reward: 250,
    icon: "💎",
    tag: "defi",
  },
  {
    id: "ot_first_daily",
    title: "Daily Warrior",
    description: "Complete your very first daily mission",
    category: "one_time",
    verification_type: "app_action",
    verification_config: { action: "first_daily" },
    xp_reward: 150,
    icon: "⚔️",
    tag: "app",
  },
  // ─── GitHub Missions ──────────────────────────────────
  {
    id: "ot_link_github",
    title: "Link GitHub Account",
    description: "Connect your GitHub account to unlock developer missions",
    category: "one_time",
    verification_type: "social_link",
    verification_config: { provider: "github" },
    xp_reward: 200,
    icon: "🐙",
    tag: "github",
  },
  {
    id: "ot_star_repo",
    title: "Star VibeProof on GitHub",
    description: "Star the VibeProof repository on GitHub to show your support",
    category: "one_time",
    verification_type: "github_star",
    verification_config: { repo: "DosukaSOL/Vibeproof" },
    xp_reward: 150,
    icon: "⭐",
    requires_social: "github",
    tag: "github",
  },
  {
    id: "ot_github_follow",
    title: "Follow VibeProof on GitHub",
    description: "Follow the DosukaSOL organization on GitHub",
    category: "one_time",
    verification_type: "github_follow",
    verification_config: { target: "DosukaSOL" },
    xp_reward: 100,
    icon: "👤",
    requires_social: "github",
    tag: "github",
  },
];

// ─── Weekly Challenge Missions (rotate every Monday) ────

const WEEKLY_POOL: MissionTemplate[] = [
  {
    id: "weekly_5_missions",
    title: "Mission Marathon",
    description: "Complete 5 missions this week",
    category: "weekly",
    verification_type: "app_action",
    verification_config: { action: "weekly_missions", target: 5 },
    xp_reward: 300,
    icon: "🏃",
    tag: "app",
  },
  {
    id: "weekly_3_checkins",
    title: "Consistent Player",
    description: "Check in on 3 different days this week",
    category: "weekly",
    verification_type: "app_action",
    verification_config: { action: "weekly_checkins", target: 3 },
    xp_reward: 200,
    icon: "📅",
    tag: "app",
  },
  {
    id: "weekly_earn_500",
    title: "XP Hunter",
    description: "Earn at least 500 XP this week",
    category: "weekly",
    verification_type: "app_action",
    verification_config: { action: "weekly_xp", target: 500 },
    xp_reward: 250,
    icon: "🎯",
    tag: "app",
  },
  {
    id: "weekly_all_daily",
    title: "Perfect Day",
    description: "Complete all daily missions in a single day",
    category: "weekly",
    verification_type: "app_action",
    verification_config: { action: "weekly_all_daily" },
    xp_reward: 400,
    icon: "🌟",
    tag: "app",
  },
  {
    id: "weekly_3_tx",
    title: "Chain Runner",
    description: "Make on-chain transactions on 3 different days",
    category: "weekly",
    verification_type: "app_action",
    verification_config: { action: "weekly_tx_days", target: 3 },
    xp_reward: 350,
    icon: "⛓️",
    tag: "on-chain",
  },
  {
    id: "weekly_streak_maintain",
    title: "Streak Keeper",
    description: "Maintain your streak for the entire week",
    category: "weekly",
    verification_type: "app_action",
    verification_config: { action: "weekly_streak" },
    xp_reward: 300,
    icon: "🔥",
    tag: "app",
  },
];

// ─── Get Today's Daily Missions ─────────────────────────

/**
 * Returns a deterministic selection of daily missions based on the date.
 * Rotates automatically — new missions every day with no manual intervention.
 * With 15 missions in the pool, users see 4 different missions each day.
 */
export function getDailyMissions(
  date: Date = new Date()
): MissionTemplate[] {
  const dayOfYear = getDayOfYear(date);
  const dateStr = date.toISOString().split("T")[0];
  const count = Math.min(4, DAILY_POOL.length);
  const indices: number[] = [];

  // Deterministic selection based on day — ensures different missions each day
  for (let i = 0; i < count; i++) {
    let idx = (dayOfYear * 7 + i * 13 + i * i * 3) % DAILY_POOL.length;
    // Avoid duplicates
    let attempts = 0;
    while (indices.includes(idx) && attempts < DAILY_POOL.length) {
      idx = (idx + 1) % DAILY_POOL.length;
      attempts++;
    }
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
  }

  // Return daily missions with date-specific IDs for auto-refresh
  return indices.map((i) => ({
    ...DAILY_POOL[i],
    id: `${DAILY_POOL[i].id}_${dateStr}`,
  }));
}

/**
 * Returns all one-time missions
 */
export function getOneTimeMissions(): MissionTemplate[] {
  return [...ONE_TIME_MISSIONS];
}

/**
 * Returns weekly challenge missions for the current ISO week.
 * Rotates every Monday — 2 challenges per week.
 */
export function getWeeklyMissions(
  date: Date = new Date()
): MissionTemplate[] {
  const weekNum = getISOWeek(date);
  const weekStr = `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  const count = 2;
  const indices: number[] = [];

  for (let i = 0; i < count; i++) {
    let idx = (weekNum * 3 + i * 7) % WEEKLY_POOL.length;
    let attempts = 0;
    while (indices.includes(idx) && attempts < WEEKLY_POOL.length) {
      idx = (idx + 1) % WEEKLY_POOL.length;
      attempts++;
    }
    if (!indices.includes(idx)) {
      indices.push(idx);
    }
  }

  return indices.map((i) => ({
    ...WEEKLY_POOL[i],
    id: `${WEEKLY_POOL[i].id}_${weekStr}`,
  }));
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Helpers ────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}
