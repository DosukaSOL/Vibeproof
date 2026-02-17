/**
 * GitHub Account Linking
 * OAuth 2.0 web flow for linking GitHub accounts to wallet profiles.
 * Supabase is lazy-loaded to prevent crashes during module initialization.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONFIG } from "./config";

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
  await AsyncStorage.setItem(GH_STORAGE_KEY, JSON.stringify(data));
}

export async function loadGitHubLink(): Promise<GitHubLinkData | null> {
  try {
    const raw = await AsyncStorage.getItem(GH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GitHubLinkData;
  } catch {
    return null;
  }
}

export async function clearGitHubLink(): Promise<void> {
  await AsyncStorage.removeItem(GH_STORAGE_KEY);
}

// ─── Supabase Social Links ──────────────────────────

export async function saveGitHubLinkToDb(
  wallet: string,
  ghUserId: string,
  ghUsername: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await getSupabase().from("user_social_links").upsert(
    {
      user_wallet: wallet,
      provider: "github",
      provider_user_id: ghUserId,
      provider_username: ghUsername,
      linked_at: now,
      last_refresh: now,
    },
    { onConflict: "user_wallet,provider" }
  );

  if (error) {
    console.error("[GitHub Link] DB save error:", error);
    throw new Error("Failed to save GitHub link to database");
  }
}

export async function removeGitHubLinkFromDb(wallet: string): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from("user_social_links")
      .delete()
      .eq("user_wallet", wallet)
      .eq("provider", "github");

    if (error) {
      console.warn("[GitHub Link] DB delete error (non-fatal):", error);
    }
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
 * Exchange authorization code for GitHub access token.
 * Note: GitHub OAuth for public clients requires the client_id only.
 * The token exchange SHOULD use a backend for security, but for mobile-only
 * apps without a backend, GitHub's web flow is the simplest approach.
 */
export async function exchangeGitHubCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string }> {
  const clientId = CONFIG.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID not configured");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    console.error("[GitHub Link] Token exchange failed: HTTP", response.status);
    throw new Error("Failed to exchange GitHub authorization code");
  }

  const json = await response.json();
  if (json.error) {
    console.error("[GitHub Link] Token exchange error:", json.error || "unknown");
    throw new Error(json.error_description || "GitHub token exchange failed");
  }

  return { access_token: json.access_token };
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
 * Full GitHub link flow: exchange code -> fetch profile -> save locally + to DB
 */
export async function completeGitHubLink(
  wallet: string,
  code: string,
  redirectUri: string
): Promise<GitHubLinkStatus> {
  // 1. Exchange code for token
  const tokens = await exchangeGitHubCode(code, redirectUri);

  // 2. Fetch profile
  const profile = await fetchGitHubProfile(tokens.access_token);

  // 3. Save locally
  const now = new Date().toISOString();
  await saveGitHubLink({
    github_user_id: profile.id.toString(),
    github_username: profile.login,
    access_token: tokens.access_token,
    linked_at: now,
  });

  // 4. Save to local social links store
  const { saveSocialLink } = require("./localStore");
  await saveSocialLink(wallet, {
    provider: "github" as const,
    username: profile.login,
    userId: profile.id.toString(),
    linkedAt: now,
  });

  // 5. Save to Supabase (non-fatal)
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
