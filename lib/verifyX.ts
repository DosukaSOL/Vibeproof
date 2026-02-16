/**
 * X (Twitter) Mission Verification
 * Verifies X actions using stored OAuth token
 */
import { loadXLink } from "./xLink";

export interface XVerificationResult {
  verified: boolean;
  proof: Record<string, any>;
  message: string;
}

// ─── Helper: Make authenticated X API request ────────
async function xApiRequest(
  endpoint: string,
  accessToken: string
): Promise<any> {
  const response = await fetch(`https://api.x.com/2${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`X API error (${response.status}): ${text}`);
  }

  return response.json();
}

// ─── Verify: Posted Tweet with Hashtag ───────────────
/**
 * Check if user posted a tweet containing the specified hashtag
 * Optionally requires the last 4 chars of their wallet address
 */
export async function verifyHashtagTweet(
  walletAddress: string,
  hashtag: string,
  requireWalletSuffix = true
): Promise<XVerificationResult> {
  try {
    const link = await loadXLink();
    if (!link) {
      return {
        verified: false,
        proof: {},
        message: "X account not linked. Link your account first.",
      };
    }

    // Search user's recent tweets
    const data = await xApiRequest(
      `/users/${link.x_user_id}/tweets?max_results=20&tweet.fields=text,created_at`,
      link.access_token
    );

    if (!data.data || data.data.length === 0) {
      return {
        verified: false,
        proof: {},
        message: "No recent tweets found",
      };
    }

    const walletSuffix = walletAddress.slice(-4).toLowerCase();
    const hashtagLower = hashtag.toLowerCase();

    for (const tweet of data.data) {
      const text = tweet.text.toLowerCase();
      const hasHashtag = text.includes(hashtagLower);
      const hasSuffix = !requireWalletSuffix || text.includes(walletSuffix);

      if (hasHashtag && hasSuffix) {
        return {
          verified: true,
          proof: {
            tweet_id: tweet.id,
            tweet_text: tweet.text,
            created_at: tweet.created_at,
          },
          message: `Found matching tweet: "${tweet.text.slice(0, 50)}..."`,
        };
      }
    }

    return {
      verified: false,
      proof: { hashtag, requireWalletSuffix },
      message: requireWalletSuffix
        ? `No tweet found with ${hashtag} and wallet suffix (${walletSuffix})`
        : `No tweet found with ${hashtag}`,
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `X verification error: ${error.message}`,
    };
  }
}

// ─── Verify: Reply to Specific Tweet ──────────────────
/**
 * Check if user replied to a specific tweet
 */
export async function verifyTweetReply(
  targetTweetId: string
): Promise<XVerificationResult> {
  try {
    const link = await loadXLink();
    if (!link) {
      return {
        verified: false,
        proof: {},
        message: "X account not linked. Link your account first.",
      };
    }

    // Fetch user's recent tweets and check for replies
    const data = await xApiRequest(
      `/users/${link.x_user_id}/tweets?max_results=50&tweet.fields=in_reply_to_user_id,referenced_tweets`,
      link.access_token
    );

    if (!data.data) {
      return {
        verified: false,
        proof: {},
        message: "No recent tweets found",
      };
    }

    for (const tweet of data.data) {
      const refs = tweet.referenced_tweets || [];
      const isReply = refs.some(
        (ref: any) => ref.type === "replied_to" && ref.id === targetTweetId
      );

      if (isReply) {
        return {
          verified: true,
          proof: {
            reply_tweet_id: tweet.id,
            target_tweet_id: targetTweetId,
          },
          message: `Reply found: tweet ${tweet.id}`,
        };
      }
    }

    return {
      verified: false,
      proof: { targetTweetId },
      message: `No reply to tweet ${targetTweetId} found`,
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `X reply verification error: ${error.message}`,
    };
  }
}

// ─── Verify: Follow Specific Account ─────────────────
/**
 * Check if user follows a specific account
 */
export async function verifyFollow(
  targetUsername: string
): Promise<XVerificationResult> {
  try {
    const link = await loadXLink();
    if (!link) {
      return {
        verified: false,
        proof: {},
        message: "X account not linked. Link your account first.",
      };
    }

    // Get the target user's ID
    const targetData = await xApiRequest(
      `/users/by/username/${targetUsername}`,
      link.access_token
    );

    if (!targetData.data) {
      return {
        verified: false,
        proof: {},
        message: `Target user @${targetUsername} not found`,
      };
    }

    const targetId = targetData.data.id;

    // Check following list
    const followingData = await xApiRequest(
      `/users/${link.x_user_id}/following?max_results=1000`,
      link.access_token
    );

    if (!followingData.data) {
      return {
        verified: false,
        proof: { targetUsername },
        message: "Could not retrieve following list",
      };
    }

    const isFollowing = followingData.data.some(
      (user: any) => user.id === targetId
    );

    if (isFollowing) {
      return {
        verified: true,
        proof: {
          target_username: targetUsername,
          target_id: targetId,
          follower_id: link.x_user_id,
        },
        message: `Confirmed: following @${targetUsername}`,
      };
    }

    return {
      verified: false,
      proof: { targetUsername, targetId },
      message: `Not following @${targetUsername}`,
    };
  } catch (error: any) {
    return {
      verified: false,
      proof: { error: error.message },
      message: `Follow verification error: ${error.message}`,
    };
  }
}

// ─── Dispatcher ──────────────────────────────────────
/**
 * Run the appropriate X verification based on type + config
 */
export async function verifyX(
  walletAddress: string,
  verificationType: string,
  config: Record<string, any>
): Promise<XVerificationResult> {
  switch (verificationType) {
    case "x_post_hashtag":
      return verifyHashtagTweet(
        walletAddress,
        config.hashtag || "#VibeProof",
        config.require_wallet_suffix !== false
      );

    case "x_reply":
      if (!config.target_tweet_id) {
        return {
          verified: false,
          proof: {},
          message: "No target_tweet_id configured",
        };
      }
      return verifyTweetReply(config.target_tweet_id);

    case "x_follow":
      if (!config.target_username) {
        return {
          verified: false,
          proof: {},
          message: "No target_username configured",
        };
      }
      return verifyFollow(config.target_username);

    default:
      return {
        verified: false,
        proof: {},
        message: `Unknown X verification type: ${verificationType}`,
      };
  }
}
