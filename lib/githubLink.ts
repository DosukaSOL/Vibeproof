/**
 * GitHub Account Linking
 * OAuth 2.0 web flow for linking GitHub accounts to wallet profiles.
 * Supabase is lazy-loaded to prevent crashes during module initialization.
 */
import { CONFIG } from "./config";
import { secureGet, secureRemove, secureSet } from "./secureStorage";

function getSupabase() {
  return require("./supabase").supabase;
}

const GH_STORAGE_KEY = "vibeproof_github_link";

// ─── Types ───────────────────────────────────────────
export interface GitHubLinkData {
  github_user_id: string;
  github_username: string;
  access_token: string;
  linked_at: string;
}

export interface GitHubLinkStatus {
  isLinked: boolean;
  username: string | null;
  userId: string | null;
  linkedAt: string | null;
}

// ─── Local Storage ───────────────────────────────────

export async function saveGitHubLink(data: GitHubLinkData): Promise<void> {
  await secureSet(GH_STORAGE_KEY, JSON.stringify(data));
}

export async function loadGitHubLink(): Promise<GitHubLinkData | null> {
  try {
    const raw = await secureGet(GH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GitHubLinkData;
  } catch {
    return null;
  }
}

export async function clearGitHubLink(): Promise<void> {
  await secureRemove(GH_STORAGE_KEY);
}

// ─── Supabase Social Links ──────────────────────────

export async function saveGitHubLinkToDb(
  wallet: string,
  ghUserId: string,
  ghUsername: string
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from("user_social_links")
      .upsert(
        {
          user_wallet: wallet,
          provider: "github",
          provider_user_id: ghUserId,
          provider_username: ghUsername,
          last_refresh: new Date().toISOString(),
        },
        { onConflict: "user_wallet,provider" }
      );
    if (error) console.warn("[GitHub Link] DB save failed:", error.message);
  } catch (err) {
    console.warn("[GitHub Link] DB save failed (non-fatal):", err);
  }
}

export async function removeGitHubLinkFromDb(wallet: string): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from("user_social_links")
      .delete()
      .eq("user_wallet", wallet)
      .eq("provider", "github");
    if (error) console.warn("[GitHub Link] DB delete failed:", error.message);
  } catch (err) {
    console.warn("[GitHub Link] DB delete failed (non-fatal):", err);
  }
}

export async function getGitHubLinkFromDb(
  wallet: string
): Promise<GitHubLinkStatus> {
  try {
    const { data, error } = await getSupabase()
      .from("user_social_links")
      .select("provider_user_id, provider_username, linked_at")
      .eq("user_wallet", wallet)
      .eq("provider", "github")
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("[GitHub Link] DB read error (non-fatal):", error);
    }

    if (!data) {
      return { isLinked: false, username: null, userId: null, linkedAt: null };
    }

    return {
      isLinked: true,
      username: data.provider_username,
      userId: data.provider_user_id,
      linkedAt: data.linked_at,
    };
  } catch (err) {
    console.warn("[GitHub Link] DB read failed (non-fatal):", err);
    return { isLinked: false, username: null, userId: null, linkedAt: null };
  }
}

/**
 * Request a Device Code from GitHub for the Device Flow.
 * The user enters the returned `user_code` at `verification_uri`.
 */
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const clientId = CONFIG.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("GITHUB_CLIENT_ID not configured");

  const response = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      scope: "read:user",
    }),
  });

  if (!response.ok) {
    console.error("[GitHub Link] Device code request failed: HTTP", response.status);
    throw new Error(
      "Failed to start GitHub authorization. Make sure Device Flow is enabled in your GitHub OAuth App settings."
    );
  }

  const json = await response.json();
  if (json.error) {
    console.error("[GitHub Link] Device code error:", json.error);
    throw new Error(json.error_description || json.error);
  }

  return json as DeviceCodeResponse;
}

/**
 * Poll GitHub for an access token after the user has entered their device code.
 * Respects the polling interval and handles slow_down / expired_token errors.
 */
export async function pollForDeviceToken(
  deviceCode: string,
  interval: number,
  expiresIn: number
): Promise<{ access_token: string }> {
  const clientId = CONFIG.GITHUB_CLIENT_ID;
  const deadline = Date.now() + expiresIn * 1000;
  let pollInterval = interval;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval * 1000));

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          device_code: deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
      }
    );

    const json = await response.json();

    if (json.access_token) {
      return { access_token: json.access_token };
    }

    if (json.error === "authorization_pending") {
      continue;
    }
    if (json.error === "slow_down") {
      pollInterval += 5;
      continue;
    }
    if (json.error === "expired_token") {
      throw new Error("Authorization timed out. Please try again.");
    }
    if (json.error === "access_denied") {
      throw new Error("Authorization was denied.");
    }

    throw new Error(
      json.error_description || json.error || "Token exchange failed"
    );
  }

  throw new Error("Authorization timed out.");
}

/**
 * Fetch GitHub user profile using access token
 */
export async function fetchGitHubProfile(
  accessToken: string
): Promise<{ id: number; login: string; name: string | null }> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub profile");
  }

  return response.json();
}

/**
 * Full GitHub link flow: use access token -> fetch profile -> save locally + to DB
 */
export async function completeGitHubLink(
  wallet: string,
  accessToken: string
): Promise<GitHubLinkStatus> {
  // 1. Fetch profile
  const profile = await fetchGitHubProfile(accessToken);

  // 2. Save locally
  const now = new Date().toISOString();
  await saveGitHubLink({
    github_user_id: profile.id.toString(),
    github_username: profile.login,
    access_token: accessToken,
    linked_at: now,
  });

  // 3. Save to local social links store
  const { saveSocialLink } = require("./localStore");
  await saveSocialLink(wallet, {
    provider: "github" as const,
    username: profile.login,
    userId: profile.id.toString(),
    linkedAt: now,
  });

  // 4. Save to Supabase (non-fatal)
  try {
    await saveGitHubLinkToDb(wallet, profile.id.toString(), profile.login);
  } catch (dbErr) {
    console.warn("[GitHub Link] DB save failed (non-fatal):", dbErr);
  }

  return {
    isLinked: true,
    username: profile.login,
    userId: profile.id.toString(),
    linkedAt: now,
  };
}

/**
 * Unlink GitHub account
 */
export async function unlinkGitHub(wallet: string): Promise<void> {
  await clearGitHubLink();
  const { removeSocialLink } = require("./localStore");
  await removeSocialLink(wallet, "github");
  await removeGitHubLinkFromDb(wallet);
}
