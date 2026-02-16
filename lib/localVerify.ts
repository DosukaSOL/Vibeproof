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
