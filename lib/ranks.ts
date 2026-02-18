/**
 * Rank Tier System
 * Bronze → Silver → Gold → Platinum → Diamond
 * Based on XP thresholds with visual badges.
 */

export interface RankTier {
  id: string;
  name: string;
  minXp: number;
  color: string;
  bg: string;
  icon: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    minXp: 0,
    color: "#CD7F32",
    bg: "rgba(205,127,50,0.12)",
    icon: "🥉",
  },
  {
    id: "silver",
    name: "Silver",
    minXp: 1000,
    color: "#C0C0C0",
    bg: "rgba(192,192,192,0.12)",
    icon: "🥈",
  },
  {
    id: "gold",
    name: "Gold",
    minXp: 5000,
    color: "#FFD700",
    bg: "rgba(255,215,0,0.12)",
    icon: "🥇",
  },
  {
    id: "platinum",
    name: "Platinum",
    minXp: 15000,
    color: "#E5E4E2",
    bg: "rgba(229,228,226,0.15)",
    icon: "💠",
  },
  {
    id: "diamond",
    name: "Diamond",
    minXp: 50000,
    color: "#B9F2FF",
    bg: "rgba(185,242,255,0.15)",
    icon: "💎",
  },
];

/**
 * Get the rank tier for a given XP amount.
 * Returns the highest tier the user qualifies for.
 */
export function getRankForXp(xp: number): RankTier {
  let rank = RANK_TIERS[0];
  for (const tier of RANK_TIERS) {
    if (xp >= tier.minXp) {
      rank = tier;
    }
  }
  return rank;
}

/**
 * Get XP needed for the next rank tier.
 * Returns null if already at max rank.
 */
export function getNextRankXp(xp: number): number | null {
  const currentRank = getRankForXp(xp);
  const currentIdx = RANK_TIERS.findIndex((t) => t.id === currentRank.id);
  if (currentIdx >= RANK_TIERS.length - 1) return null;
  return RANK_TIERS[currentIdx + 1].minXp;
}

/**
 * Get progress percentage toward next rank (0-1).
 */
export function getRankProgress(xp: number): number {
  const currentRank = getRankForXp(xp);
  const nextXp = getNextRankXp(xp);
  if (nextXp === null) return 1; // Max rank
  const range = nextXp - currentRank.minXp;
  if (range <= 0) return 1;
  return Math.min(1, (xp - currentRank.minXp) / range);
}
