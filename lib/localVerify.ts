/**
 * Local Mission Verification
 * Verifies missions using on-chain RPC, X API, and local state checks.
 * No Supabase dependency — works fully offline for most verification types.
 */
import { getLocalUser, hasSocialLink } from "./localStore";
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

    case "daily_checkin":
      // Opening the app counts as a check-in
      return { verified: true, message: "Checked in for today!" };

    default:
      return {
        verified: false,
        message: `Unknown app action: ${config.action}`,
      };
  }
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
