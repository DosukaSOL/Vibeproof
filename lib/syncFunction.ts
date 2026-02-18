/**
 * Secure Supabase Sync — routes all writes through the sync-user Edge Function.
 *
 * After RLS lock-down (migration 003), the anon key can only SELECT.
 * All INSERT/UPDATE/DELETE operations go through this function,
 * which calls the Edge Function that has service_role access.
 */
import { CONFIG } from "./config";

const FUNCTION_URL = CONFIG.SUPABASE_URL
  ? `${CONFIG.SUPABASE_URL}/functions/v1/sync-user`
  : null;

/**
 * Call the sync-user Edge Function with the given action and payload.
 * Non-blocking by default — catch errors externally if needed.
 */
export async function callSyncFunction(
  action: string,
  wallet: string,
  data: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: string }> {
  if (!FUNCTION_URL || !CONFIG.SUPABASE_ANON_KEY) {
    console.warn("[syncFunction] Supabase not configured — skipping sync");
    return { success: false, error: "Not configured" };
  }

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      apikey: CONFIG.SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, wallet, ...data }),
  });

  const json = await response.json();

  if (!response.ok) {
    console.warn(`[syncFunction] ${action} failed:`, json.error);
    return { success: false, error: json.error };
  }

  return { success: true };
}

/** Upsert user profile to Supabase (via Edge Function) */
export async function syncUser(
  wallet: string,
  fields: {
    username?: string | null;
    xp?: number;
    streak?: number;
    rank?: number;
    level?: number;
    avatar_url?: string;
  }
): Promise<void> {
  await callSyncFunction("upsert_user", wallet, fields);
}

/** Save social link to Supabase (via Edge Function) */
export async function syncSocialLink(
  wallet: string,
  provider: string,
  providerUserId: string,
  providerUsername: string
): Promise<void> {
  await callSyncFunction("upsert_social", wallet, {
    provider,
    provider_user_id: providerUserId,
    provider_username: providerUsername,
  });
}

/** Remove social link from Supabase (via Edge Function) */
export async function removeSyncSocialLink(
  wallet: string,
  provider: string
): Promise<void> {
  await callSyncFunction("delete_social", wallet, { provider });
}

/** Save avatar URL to Supabase (via Edge Function) */
export async function syncAvatarUrl(
  wallet: string,
  avatarUrl: string
): Promise<void> {
  await callSyncFunction("upload_avatar_url", wallet, { avatar_url: avatarUrl });
}
