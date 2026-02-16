/**
 * Supabase Client & Database Integration
 *
 * The client is LAZY-INITIALIZED on first use (not at module load time)
 * to prevent native crashes during module initialization.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CONFIG } from "./config";

// ─── Lazy Client Initialization ─────────────────────────
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    try {
      _client = createClient(
        CONFIG.SUPABASE_URL || "https://placeholder.supabase.co",
        CONFIG.SUPABASE_ANON_KEY || "placeholder_key",
        {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        }
      );
    } catch (e) {
      console.error("[Supabase] createClient failed:", e);
      // Return a no-op client so the app doesn't crash
      return createNoopClient();
    }
  }
  return _client;
}

/**
 * No-op Supabase client that returns empty results for everything.
 * Used as fallback if createClient() fails.
 */
function createNoopClient(): SupabaseClient {
  const noopQuery = {
    select: () => noopQuery,
    insert: () => noopQuery,
    update: () => noopQuery,
    upsert: () => noopQuery,
    delete: () => noopQuery,
    eq: () => noopQuery,
    neq: () => noopQuery,
    gt: () => noopQuery,
    lt: () => noopQuery,
    or: () => noopQuery,
    order: () => noopQuery,
    range: () => noopQuery,
    limit: () => noopQuery,
    single: () => Promise.resolve({ data: null, error: { code: "NO_CLIENT", message: "Supabase not initialized" } }),
    then: (resolve: any) => resolve({ data: null, error: { code: "NO_CLIENT", message: "Supabase not initialized" } }),
  };
  return {
    from: () => noopQuery,
    rpc: () => Promise.resolve({ data: null, error: { code: "NO_CLIENT", message: "Supabase not initialized" } }),
    auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
  } as any;
}

/**
 * Supabase client accessor.
 * Uses a Proxy to lazy-initialize on first use.
 * This way, importing this module does NOT immediately call createClient().
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Database Types for Type Safety
 */
export interface DbUser {
  id: string;
  wallet: string;
  username: string;
  xp: number;
  streak: number;
  rank: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface DbMission {
  id: string;
  title: string;
  description: string;
  mission_type: "follow" | "post" | "join" | "verify";
  target_url?: string;
  xp_reward: number;
  active: boolean;
  created_at: string;
}

export interface DbCompletion {
  id: string;
  user_wallet: string;
  mission_id: string;
  proof: string;
  verified: boolean;
  created_at: string;
  verified_at?: string;
}

export interface DbRank {
  id: string;
  user_wallet: string;
  rank: number;
  xp_total: number;
  level: number;
  updated_at: string;
}

/**
 * Authentication Functions
 */

/**
 * Create or update user profile
 */
export async function upsertUser(
  wallet: string,
  username: string
): Promise<DbUser> {
  const { data, error } = await supabase
    .from("users")
    .upsert({
      wallet,
      username,
      updated_at: new Date().toISOString(),
    })
    .eq("wallet", wallet)
    .select()
    .single();

  if (error) throw error;
  return data as DbUser;
}

/**
 * Get user by wallet
 */
export async function getUser(wallet: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("wallet", wallet)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, which is fine
    throw error;
  }
  return (data as DbUser) || null;
}

/**
 * Update username for user
 */
export async function updateUsername(
  wallet: string,
  username: string
): Promise<DbUser> {
  const { data, error } = await supabase
    .from("users")
    .update({ username, updated_at: new Date().toISOString() })
    .eq("wallet", wallet)
    .select()
    .single();

  if (error) throw error;
  return data as DbUser;
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (error && error.code === "PGRST116") {
    // Not found = available
    return true;
  }
  return !data;
}

/**
 * Mission Functions
 */

/**
 * Get all active missions
 */
export async function getMissions(): Promise<DbMission[]> {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbMission[]) || [];
}

/**
 * Get mission by ID
 */
export async function getMission(id: string): Promise<DbMission | null> {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return (data as DbMission) || null;
}

/**
 * Mission Completion Functions
 */

/**
 * Submit mission completion with proof
 */
export async function submitMissionCompletion(
  userWallet: string,
  missionId: string,
  proof: string
): Promise<DbCompletion> {
  const { data, error } = await supabase
    .from("completions")
    .insert({
      user_wallet: userWallet,
      mission_id: missionId,
      proof,
      verified: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbCompletion;
}

/**
 * Get user's mission completions
 */
export async function getUserCompletions(
  userWallet: string
): Promise<DbCompletion[]> {
  const { data, error } = await supabase
    .from("completions")
    .select("*")
    .eq("user_wallet", userWallet)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbCompletion[]) || [];
}

/**
 * Check if user completed a mission
 */
export async function hasMissionCompleted(
  userWallet: string,
  missionId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("completions")
    .select("id")
    .eq("user_wallet", userWallet)
    .eq("mission_id", missionId)
    .eq("verified", true)
    .single();

  if (error && error.code === "PGRST116") {
    return false;
  }
  return !!data;
}

/**
 * Leaderboard Functions
 */

/**
 * Get leaderboard (top users by XP)
 */
export async function getLeaderboard(
  limit = 50,
  offset = 0
): Promise<DbUser[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("xp", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data as DbUser[]) || [];
}

/**
 * Get user's leaderboard rank
 */
export async function getUserRank(wallet: string): Promise<number> {
  const { data, error } = await supabase.rpc("get_user_rank", {
    p_wallet: wallet,
  });

  if (error) throw error;
  return (data as number) || 0;
}

/**
 * Add XP to user and update rank
 */
export async function addUserXP(
  wallet: string,
  amount: number
): Promise<DbUser> {
  const { data: userData, error: selectError } = await supabase
    .from("users")
    .select("xp")
    .eq("wallet", wallet)
    .single();

  if (selectError) throw selectError;

  const currentXP = (userData?.xp || 0) as number;
  const newXP = currentXP + amount;

  const { data, error } = await supabase
    .from("users")
    .update({
      xp: newXP,
      updated_at: new Date().toISOString(),
    })
    .eq("wallet", wallet)
    .select()
    .single();

  if (error) throw error;
  return data as DbUser;
}

/**
 * Health Check
 */
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    return !error;
  } catch {
    return false;
  }
}
