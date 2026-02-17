/**
 * X (Twitter) Account Linking
 * OAuth 2.0 PKCE flow for linking X accounts to wallet profiles.
 * Supabase is lazy-loaded to prevent crashes during module initialization.
 */
import { CONFIG } from "./config";
import { secureGet, secureRemove, secureSet } from "./secureStorage";

// Lazy Supabase getter — only loaded when actually calling DB functions
function getSupabase() {
  return require("./supabase").supabase;
}

const X_STORAGE_KEY = "vibeproof_x_link";

// ─── Types ───────────────────────────────────────────
export interface XLinkData {
  x_user_id: string;
  x_username: string;
  access_token: string;
  refresh_token?: string;
  linked_at: string;
  last_refresh: string;
}

export interface XLinkStatus {
  isLinked: boolean;
  username: string | null;
  userId: string | null;
  linkedAt: string | null;
}

// ─── Local Storage ───────────────────────────────────

/**
 * Store X link data locally (tokens + profile info)
 */
export async function saveXLink(data: XLinkData): Promise<void> {
  await secureSet(X_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load X link data from local storage
 */
export async function loadXLink(): Promise<XLinkData | null> {
  try {
    const raw = await secureGet(X_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as XLinkData;
  } catch {
    return null;
  }
}

/**
 * Clear X link data locally
 */
export async function clearXLink(): Promise<void> {
  await secureRemove(X_STORAGE_KEY);
}

// ─── Supabase Social Links ──────────────────────────

/**
 * Save X link to Supabase user_social_links table
 */
export async function saveXLinkToDb(
  wallet: string,
  xUserId: string,
  xUsername: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await getSupabase().from("user_social_links").upsert(
    {
      user_wallet: wallet,
      provider: "x",
      provider_user_id: xUserId,
      provider_username: xUsername,
      linked_at: now,
      last_refresh: now,
    },
    { onConflict: "user_wallet,provider" }
  );

  if (error) {
    console.error("[X Link] DB save error:", error);
    throw new Error("Failed to save X link to database");
  }
}

/**
 * Remove X link from Supabase
 */
export async function removeXLinkFromDb(wallet: string): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from("user_social_links")
      .delete()
      .eq("user_wallet", wallet)
      .eq("provider", "x");

    if (error) {
      console.warn("[X Link] DB delete error (non-fatal):", error);
    }
  } catch (err) {
    console.warn("[X Link] DB delete failed (non-fatal):", err);
  }
}

/**
 * Get X link status from Supabase
 */
export async function getXLinkFromDb(
  wallet: string
): Promise<XLinkStatus> {
  try {
    const { data, error } = await getSupabase()
      .from("user_social_links")
      .select("provider_user_id, provider_username, linked_at")
      .eq("user_wallet", wallet)
      .eq("provider", "x")
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("[X Link] DB read error (non-fatal):", error);
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
    console.warn("[X Link] DB read failed (non-fatal):", err);
    return { isLinked: false, username: null, userId: null, linkedAt: null };
  }
}

/**
 * Exchange authorization code for X access token
 * This should ideally be done server-side via Supabase Edge Function
 * For now we provide the client-side structure
 */
export async function exchangeXCode(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const clientId = CONFIG.X_CLIENT_ID;
  if (!clientId) {
    throw new Error("X_CLIENT_ID not configured");
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }).toString(),
  });

  if (!response.ok) {
    console.error("[X Link] Token exchange failed: HTTP", response.status);
    throw new Error("Failed to exchange X authorization code");
  }

  return response.json();
}

/**
 * Fetch X user profile using access token
 */
export async function fetchXProfile(
  accessToken: string
): Promise<{ id: string; username: string; name: string }> {
  const response = await fetch(
    "https://api.x.com/2/users/me?user.fields=username",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch X profile");
  }

  const json = await response.json();
  return json.data;
}

/**
 * Full X link flow: exchange code -> fetch profile -> save locally + to DB
 */
export async function completeXLink(
  wallet: string,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<XLinkStatus> {
  // 1. Exchange code for tokens
  const tokens = await exchangeXCode(code, codeVerifier, redirectUri);

  // 2. Fetch profile
  const profile = await fetchXProfile(tokens.access_token);

  // 3. Save locally
  const now = new Date().toISOString();
  await saveXLink({
    x_user_id: profile.id,
    x_username: profile.username,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    linked_at: now,
    last_refresh: now,
  });

  // 4. Save to local social links store
  const { saveSocialLink } = require("./localStore");
  await saveSocialLink(wallet, {
    provider: "x" as const,
    username: profile.username,
    userId: profile.id,
    linkedAt: now,
  });

  // 5. Save to Supabase (non-fatal — link works locally even if DB fails)
  try {
    await saveXLinkToDb(wallet, profile.id, profile.username);
  } catch (dbErr) {
    console.warn("[X Link] DB save failed (non-fatal):", dbErr);
  }

  return {
    isLinked: true,
    username: profile.username,
    userId: profile.id,
    linkedAt: now,
  };
}

/**
 * Unlink X account
 */
export async function unlinkX(wallet: string): Promise<void> {
  await clearXLink();
  const { removeSocialLink } = require("./localStore");
  await removeSocialLink(wallet, "x");
  await removeXLinkFromDb(wallet);
}
