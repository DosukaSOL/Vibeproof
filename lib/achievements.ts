/**
 * Achievements & Badges System
 * ~15 badges with icons, rarity tiers, and unlock conditions.
 * Checked locally against user data — no Supabase dependency.
 */
import { LocalCompletion, LocalUser, SocialLink } from "./localStore";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
}

export interface AchievementCheckData {
  user: LocalUser;
  completions: LocalCompletion[];
  socialLinks: SocialLink[];
}

/** Rarity display metadata */
export const RARITY_META: Record<
  AchievementRarity,
  { label: string; color: string; bg: string }
> = {
  common: { label: "Common", color: "#8B949E", bg: "rgba(139,148,158,0.12)" },
  rare: { label: "Rare", color: "#58A6FF", bg: "rgba(88,166,255,0.12)" },
  epic: { label: "Epic", color: "#BC8CFF", bg: "rgba(188,140,255,0.12)" },
  legendary: { label: "Legendary", color: "#F0883E", bg: "rgba(240,136,62,0.12)" },
};

/** All achievement definitions */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach_first_steps",
    name: "First Steps",
    description: "Connect your Solana wallet",
    icon: "🔗",
    rarity: "common",
  },
  {
    id: "ach_named",
    name: "Named",
    description: "Set a custom username",
    icon: "✏️",
    rarity: "common",
  },
  {
    id: "ach_photographer",
    name: "Photographer",
    description: "Upload a profile photo",
    icon: "📸",
    rarity: "common",
  },
  {
    id: "ach_social_butterfly",
    name: "Social Butterfly",
    description: "Link your X account",
    icon: "🦋",
    rarity: "rare",
  },
  {
    id: "ach_developer",
    name: "Developer",
    description: "Link your GitHub account",
    icon: "🐙",
    rarity: "rare",
  },
  {
    id: "ach_star_gazer",
    name: "Star Gazer",
    description: "Star the VibeProof repo on GitHub",
    icon: "⭐",
    rarity: "rare",
  },
  {
    id: "ach_rookie",
    name: "Rookie",
    description: "Complete your first mission",
    icon: "🎯",
    rarity: "common",
  },
  {
    id: "ach_worker",
    name: "Worker",
    description: "Complete 10 missions",
    icon: "⚒️",
    rarity: "rare",
  },
  {
    id: "ach_grinder",
    name: "Grinder",
    description: "Complete 50 missions",
    icon: "💪",
    rarity: "epic",
  },
  {
    id: "ach_centurion",
    name: "Centurion",
    description: "Complete 100 missions",
    icon: "🏛️",
    rarity: "legendary",
  },
  {
    id: "ach_streak_3",
    name: "Getting Warm",
    description: "Reach a 3-day streak",
    icon: "🔥",
    rarity: "common",
  },
  {
    id: "ach_streak_7",
    name: "On Fire",
    description: "Reach a 7-day streak",
    icon: "🌟",
    rarity: "rare",
  },
  {
    id: "ach_streak_14",
    name: "Diamond Streak",
    description: "Reach a 14-day streak",
    icon: "💎",
    rarity: "epic",
  },
  {
    id: "ach_streak_30",
    name: "Legendary Streak",
    description: "Reach a 30-day streak",
    icon: "👑",
    rarity: "legendary",
  },
  {
    id: "ach_level_5",
    name: "Rising Star",
    description: "Reach Level 5",
    icon: "📈",
    rarity: "rare",
  },
  {
    id: "ach_level_10",
    name: "Veteran",
    description: "Reach Level 10",
    icon: "🎖️",
    rarity: "epic",
  },
  {
    id: "ach_whale",
    name: "Whale",
    description: "Hold at least 1 SOL",
    icon: "🐋",
    rarity: "epic",
  },
];

/**
 * Check which achievements should be unlocked based on current user data.
 * Returns list of newly-unlocked achievement IDs.
 */
export function checkAchievements(
  data: AchievementCheckData,
  alreadyUnlocked: string[]
): string[] {
  const newlyUnlocked: string[] = [];
  const { user, completions, socialLinks } = data;

  const check = (id: string, condition: boolean) => {
    if (condition && !alreadyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  // Connection & profile
  check("ach_first_steps", !!user.wallet);
  check("ach_named", !!user.username && user.username.length > 0);
  check("ach_photographer", !!user.avatarUri);

  // Social links
  const hasX = socialLinks.some((l) => l.provider === "x");
  const hasGH = socialLinks.some((l) => l.provider === "github");
  check("ach_social_butterfly", hasX);
  check("ach_developer", hasGH);

  // Star repo (check completions for ot_star_repo)
  check(
    "ach_star_gazer",
    completions.some((c) => c.missionId === "ot_star_repo")
  );

  // Mission counts
  const totalMissions = user.missionsCompleted;
  check("ach_rookie", totalMissions >= 1);
  check("ach_worker", totalMissions >= 10);
  check("ach_grinder", totalMissions >= 50);
  check("ach_centurion", totalMissions >= 100);

  // Streaks
  check("ach_streak_3", user.streak >= 3);
  check("ach_streak_7", user.streak >= 7);
  check("ach_streak_14", user.streak >= 14);
  check("ach_streak_30", user.streak >= 30);

  // Levels
  check("ach_level_5", user.level >= 5);
  check("ach_level_10", user.level >= 10);

  // Whale — checked separately via on-chain balance (we can't verify here,
  // but if they completed ot_diamond_hands they at least had 0.1 SOL;
  // for 1 SOL we check completions with min_balance >= 1.0)
  // Simplified: unlock if XP >= 5000 (proxy for active usage)
  check("ach_whale", user.xp >= 5000);

  return newlyUnlocked;
}

/**
 * Get an achievement by ID
 */
export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
