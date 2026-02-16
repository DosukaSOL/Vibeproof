/**
 * Mission Templates — hardcoded missions for daily rotation & one-time completion
 * Daily missions rotate automatically based on the day of year.
 * No Supabase dependency — works fully offline.
 */

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
}

// ─── Daily Mission Pool (rotate each day) ───────────────

const DAILY_POOL: MissionTemplate[] = [
  {
    id: "daily_tx",
    title: "Make a Solana Transaction",
    description:
      "Send any transaction on Solana mainnet in the last 24 hours",
    category: "daily",
    verification_type: "on_chain_tx",
    verification_config: { window_hours: 24 },
    xp_reward: 100,
    icon: "⛓️",
  },
  {
    id: "daily_balance",
    title: "HODL Check",
    description:
      "Verify you're holding at least 0.01 SOL in your wallet",
    category: "daily",
    verification_type: "on_chain_balance",
    verification_config: { min_balance: 0.01 },
    xp_reward: 50,
    icon: "💰",
  },
  {
    id: "daily_tweet",
    title: "Tweet about VibeProof",
    description:
      "Post a tweet with #VibeProof and the last 4 digits of your wallet address",
    category: "daily",
    verification_type: "x_post_hashtag",
    verification_config: {
      hashtag: "#VibeProof",
      require_wallet_suffix: true,
    },
    xp_reward: 150,
    icon: "𝕏",
    requires_social: "x",
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
  },
  {
    id: "daily_share",
    title: "Share with a Friend",
    description:
      "Share VibeProof with someone (provide a screenshot as proof)",
    category: "daily",
    verification_type: "manual",
    verification_config: {},
    xp_reward: 75,
    icon: "📤",
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
  },
  {
    id: "ot_link_x",
    title: "Link X Account",
    description:
      "Connect your X (Twitter) account to unlock social missions",
    category: "one_time",
    verification_type: "social_link",
    verification_config: { provider: "x" },
    xp_reward: 200,
    icon: "𝕏",
  },
  {
    id: "ot_link_telegram",
    title: "Join Telegram",
    description: "Join the VibeProof Telegram community",
    category: "one_time",
    verification_type: "social_link",
    verification_config: { provider: "telegram" },
    xp_reward: 150,
    icon: "✈️",
  },
  {
    id: "ot_link_discord",
    title: "Join Discord",
    description: "Join the VibeProof Discord server",
    category: "one_time",
    verification_type: "social_link",
    verification_config: { provider: "discord" },
    xp_reward: 150,
    icon: "💬",
  },
  {
    id: "ot_follow_vibeproof",
    title: "Follow @VibeProofSOL on X",
    description: "Follow the official VibeProof account on X",
    category: "one_time",
    verification_type: "x_follow",
    verification_config: { target_username: "VibeProofSOL" },
    xp_reward: 100,
    icon: "👥",
    requires_social: "x",
  },
  {
    id: "ot_first_tweet",
    title: "First VibeProof Tweet",
    description: "Post your first tweet mentioning #VibeProof",
    category: "one_time",
    verification_type: "x_post_hashtag",
    verification_config: {
      hashtag: "#VibeProof",
      require_wallet_suffix: false,
    },
    xp_reward: 200,
    icon: "📝",
    requires_social: "x",
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
  },
];

// ─── Get Today's Daily Missions ─────────────────────────

/**
 * Returns a deterministic selection of daily missions based on the date.
 * Rotates automatically — new missions every day with no manual intervention.
 */
export function getDailyMissions(
  date: Date = new Date()
): MissionTemplate[] {
  const dayOfYear = getDayOfYear(date);
  const dateStr = date.toISOString().split("T")[0];
  const count = Math.min(4, DAILY_POOL.length);
  const indices: number[] = [];

  // Deterministic selection based on day
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

  // Return daily missions with date-specific IDs
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
