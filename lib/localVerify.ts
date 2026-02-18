/**
 * Local Mission Verification
 * Verifies missions using on-chain RPC, X API, and local state checks.
 * No Supabase dependency — works fully offline for most verification types.
 */
import { getCompletions, getLocalUser, hasSocialLink } from "./localStore";
import {
    verifyMinBalance,
    verifyRecentTransaction,
    verifySelfTransfer,
} from "./verifyOnChain";
import { verifyX } from "./verifyX";

export interface VerifyResult {
  verified: boolean;
  message: string;
  proof?: Record<string, any>;
}

/**
 * Run verification for any mission type
 */
export async function verifyMission(
  wallet: string,
  verificationType: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  try {
    switch (verificationType) {
      case "on_chain_tx": {
        const r = await verifyRecentTransaction(
          wallet,
          config.window_hours || 24
        );
        return { verified: r.verified, message: r.message, proof: r.proof };
      }

      case "on_chain_balance": {
        const r = await verifyMinBalance(wallet, config.min_balance || 0.01);
        return { verified: r.verified, message: r.message, proof: r.proof };
      }

      case "on_chain_transfer": {
        const r = await verifySelfTransfer(
          wallet,
          config.window_hours || 24
        );
        return { verified: r.verified, message: r.message, proof: r.proof };
      }

      case "x_post_hashtag": {
        const r = await verifyX(wallet, "x_post_hashtag", config);
        return { verified: r.verified, message: r.message, proof: r.proof };
      }

      case "x_follow": {
        const r = await verifyX(wallet, "x_follow", config);
        return { verified: r.verified, message: r.message, proof: r.proof };
      }

      case "app_action":
        return await verifyAppAction(wallet, config);

      case "social_link":
        return await verifySocialLink(wallet, config);

      case "github_star":
        return await verifyGitHubStar(wallet, config);

      case "github_follow":
        return await verifyGitHubFollow(wallet, config);

      case "manual":
        // Manual missions are always "verified" — proof is user-submitted
        return {
          verified: true,
          message: "Proof submitted successfully",
        };

      default:
        return {
          verified: false,
          message: `Unknown verification type: ${verificationType}`,
        };
    }
  } catch (err: any) {
    return {
      verified: false,
      message: err?.message || "Verification failed",
    };
  }
}

// ─── App Action Verification ────────────────────────────

async function verifyAppAction(
  wallet: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  switch (config.action) {
    case "first_connect":
      // If they can call this, they're connected
      return { verified: true, message: "Wallet connected!" };

    case "set_username": {
      const user = await getLocalUser(wallet);
      const has = !!user?.username?.trim();
      return {
        verified: has,
        message: has
          ? `Username: ${user!.username}`
          : "Set a username on your Profile first",
      };
    }

    case "set_avatar": {
      const user = await getLocalUser(wallet);
      const has = !!user?.avatarUri && user.avatarUri.length > 0;
      return {
        verified: has,
        message: has
          ? "Profile photo set!"
          : "Upload a profile photo on your Profile first",
      };
    }

    case "daily_checkin":
      // Opening the app counts as a check-in
      return { verified: true, message: "Checked in for today!" };

    case "first_daily": {
      // Check if user has completed at least one daily mission
      const completions = await getCompletions(wallet);
      const hasDailyCompletion = completions.some((c) =>
        c.missionId.startsWith("daily_")
      );
      return {
        verified: hasDailyCompletion,
        message: hasDailyCompletion
          ? "First daily mission completed!"
          : "Complete any daily mission first",
      };
    }

    // ─── Weekly challenge verifications ──────────────
    case "weekly_missions": {
      const completions = await getCompletions(wallet);
      const weekStart = getWeekStart();
      const thisWeek = completions.filter(
        (c) => c.completedAt >= weekStart
      );
      const target = config.target || 5;
      const met = thisWeek.length >= target;
      return {
        verified: met,
        message: met
          ? `Completed ${thisWeek.length} missions this week!`
          : `Complete ${target - thisWeek.length} more missions this week (${thisWeek.length}/${target})`,
      };
    }

    case "weekly_checkins": {
      const completions = await getCompletions(wallet);
      const weekStart = getWeekStart();
      const uniqueDays = new Set(
        completions
          .filter((c) => c.completedAt >= weekStart)
          .map((c) => c.date)
      );
      const target = config.target || 3;
      const met = uniqueDays.size >= target;
      return {
        verified: met,
        message: met
          ? `Active on ${uniqueDays.size} days this week!`
          : `Be active on ${target - uniqueDays.size} more days this week (${uniqueDays.size}/${target})`,
      };
    }

    case "weekly_xp": {
      const completions = await getCompletions(wallet);
      const weekStart = getWeekStart();
      const weeklyXp = completions
        .filter((c) => c.completedAt >= weekStart)
        .reduce((sum, c) => sum + c.xpAwarded, 0);
      const target = config.target || 500;
      const met = weeklyXp >= target;
      return {
        verified: met,
        message: met
          ? `Earned ${weeklyXp} XP this week!`
          : `Earn ${target - weeklyXp} more XP this week (${weeklyXp}/${target})`,
      };
    }

    case "weekly_all_daily": {
      const completions = await getCompletions(wallet);
      const weekStart = getWeekStart();
      // Check if any single day this week has 4+ daily completions (full set)
      const dayMap = new Map<string, number>();
      completions
        .filter(
          (c) =>
            c.completedAt >= weekStart && c.missionId.startsWith("daily_")
        )
        .forEach((c) => {
          dayMap.set(c.date, (dayMap.get(c.date) || 0) + 1);
        });
      const met = Array.from(dayMap.values()).some((count) => count >= 4);
      return {
        verified: met,
        message: met
          ? "Completed all daily missions in a single day!"
          : "Complete all 4 daily missions in one day",
      };
    }

    case "weekly_tx_days": {
      const completions = await getCompletions(wallet);
      const weekStart = getWeekStart();
      const txDays = new Set(
        completions
          .filter(
            (c) =>
              c.completedAt >= weekStart &&
              (c.missionId.includes("_tx") ||
                c.missionId.includes("_transfer") ||
                c.missionId.includes("_swap"))
          )
          .map((c) => c.date)
      );
      const target = config.target || 3;
      const met = txDays.size >= target;
      return {
        verified: met,
        message: met
          ? `On-chain activity on ${txDays.size} days this week!`
          : `Make on-chain transactions on ${target - txDays.size} more days (${txDays.size}/${target})`,
      };
    }

    case "weekly_streak": {
      const user = await getLocalUser(wallet);
      const met = (user?.streak ?? 0) >= 7;
      return {
        verified: met,
        message: met
          ? `Streak at ${user!.streak} days!`
          : `Maintain a 7-day streak (current: ${user?.streak ?? 0})`,
      };
    }

    default:
      return {
        verified: false,
        message: `Unknown app action: ${config.action}`,
      };
  }
}

/** Get ISO week start (Monday 00:00) as ISO string */
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// ─── Social Link Verification ───────────────────────────

async function verifySocialLink(
  wallet: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const provider = config.provider;
  const linked = await hasSocialLink(wallet, provider);
  return {
    verified: linked,
    message: linked
      ? `${provider} account linked!`
      : `Link your ${provider} account first`,
  };
}

// ─── GitHub Verification ────────────────────────────────

async function getGitHubToken(): Promise<string | null> {
  try {
    const { loadGitHubLink } = require("./githubLink");
    const link = await loadGitHubLink();
    return link?.access_token || null;
  } catch {
    return null;
  }
}

async function verifyGitHubStar(
  wallet: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const token = await getGitHubToken();
  if (!token) {
    return { verified: false, message: "Link your GitHub account first" };
  }

  const repo = config.repo;
  if (!repo) {
    return { verified: false, message: "Missing repo configuration" };
  }

  try {
    // Check if user has starred the repo
    const response = await fetch(
      `https://api.github.com/user/starred/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    // 204 = starred, 404 = not starred
    if (response.status === 204) {
      return {
        verified: true,
        message: `Starred ${repo}!`,
        proof: { repo, starred: true },
      };
    }

    return {
      verified: false,
      message: `Star the ${repo} repository on GitHub, then verify again`,
    };
  } catch (err: any) {
    return {
      verified: false,
      message: err?.message || "Failed to check GitHub star",
    };
  }
}

async function verifyGitHubFollow(
  wallet: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const token = await getGitHubToken();
  if (!token) {
    return { verified: false, message: "Link your GitHub account first" };
  }

  const target = config.target;
  if (!target) {
    return { verified: false, message: "Missing target configuration" };
  }

  try {
    // Check if user follows the target user/org
    const response = await fetch(
      `https://api.github.com/user/following/${target}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    // 204 = following, 404 = not following
    if (response.status === 204) {
      return {
        verified: true,
        message: `Following ${target}!`,
        proof: { target, following: true },
      };
    }

    return {
      verified: false,
      message: `Follow ${target} on GitHub, then verify again`,
    };
  } catch (err: any) {
    return {
      verified: false,
      message: err?.message || "Failed to check GitHub follow",
    };
  }
}
