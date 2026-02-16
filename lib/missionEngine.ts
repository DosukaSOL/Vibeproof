/**
 * Mission Engine
 * Generates mission instances and orchestrates verification
 */
import { supabase } from "./supabase";
import { verifyOnChain } from "./verifyOnChain";
import { verifyX } from "./verifyX";
import { loadXLink } from "./xLink";

// ─── Types ───────────────────────────────────────────
export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  category: "repeatable" | "one_time";
  verification_type: string;
  verification_config: Record<string, any>;
  recurrence: "daily" | "weekly" | "one_time";
  xp_reward: number;
  active: boolean;
  sort_order: number;
}

export interface MissionInstance {
  id: string;
  template_id: string;
  period: string;
  title: string;
  description: string;
  verification_type: string;
  verification_config: Record<string, any>;
  xp_reward: number;
  category: string;
  starts_at: string;
  expires_at: string | null;
  active: boolean;
}

export interface MissionCompletion {
  id: string;
  user_wallet: string;
  mission_instance_id: string | null;
  mission_template_id: string | null;
  status: "pending" | "verifying" | "verified" | "failed" | "expired";
  proof_data: Record<string, any>;
  verification_result: Record<string, any> | null;
  xp_awarded: number;
  completed_at: string | null;
  verified_at: string | null;
  created_at: string;
}

// ─── Generate Today's Mission Instances ──────────────
/**
 * Call the Supabase function to generate daily/weekly mission instances.
 * Safe to call multiple times — uses ON CONFLICT DO NOTHING.
 */
export async function generateMissionInstances(): Promise<number> {
  const { data, error } = await supabase.rpc("generate_daily_missions");

  if (error) {
    console.error("[MissionEngine] Generation error:", error);
    // Non-fatal — missions may already exist
    return 0;
  }

  return data || 0;
}

// ─── Get Active Mission Instances ────────────────────
/**
 * Get today's active mission instances (repeatable)
 */
export async function getActiveMissions(): Promise<MissionInstance[]> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("mission_instances")
    .select("*")
    .eq("active", true)
    .eq("category", "repeatable")
    .or(`period.eq.${today},expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[MissionEngine] Fetch active missions error:", error);
    throw error;
  }

  return (data as MissionInstance[]) || [];
}

// ─── Get One-Time Mission Templates ──────────────────
/**
 * Get all one-time mission templates
 */
export async function getOneTimeMissions(): Promise<MissionTemplate[]> {
  const { data, error } = await supabase
    .from("mission_templates")
    .select("*")
    .eq("category", "one_time")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[MissionEngine] Fetch one-time missions error:", error);
    throw error;
  }

  return (data as MissionTemplate[]) || [];
}

// ─── Get User's Completions ──────────────────────────
/**
 * Get all completions for a user
 */
export async function getUserMissionCompletions(
  wallet: string
): Promise<MissionCompletion[]> {
  const { data, error } = await supabase
    .from("mission_completions")
    .select("*")
    .eq("user_wallet", wallet)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[MissionEngine] Fetch completions error:", error);
    throw error;
  }

  return (data as MissionCompletion[]) || [];
}

// ─── Check One-Time Completion ───────────────────────
/**
 * Check if user already completed a one-time mission template
 */
export function hasCompletedOneTime(
  completions: MissionCompletion[],
  templateId: string
): boolean {
  return completions.some(
    (c) =>
      c.mission_template_id === templateId &&
      (c.status === "verified" || c.status === "verifying" || c.status === "pending")
  );
}

/**
 * Check if user already completed a mission instance
 */
export function hasCompletedInstance(
  completions: MissionCompletion[],
  instanceId: string
): boolean {
  return completions.some(
    (c) =>
      c.mission_instance_id === instanceId &&
      (c.status === "verified" || c.status === "verifying" || c.status === "pending")
  );
}

// ─── Verify & Complete a Mission ─────────────────────
/**
 * Verify and record a mission completion.
 * For on-chain and X missions, verification is automatic.
 * For app_action and manual, proof is passed directly.
 */
export async function verifyAndComplete(
  wallet: string,
  opts: {
    instanceId?: string;
    templateId?: string;
    verificationType: string;
    verificationConfig: Record<string, any>;
    xpReward: number;
    manualProof?: string;
  }
): Promise<MissionCompletion> {
  const { instanceId, templateId, verificationType, verificationConfig, xpReward, manualProof } = opts;

  // 1. Create pending completion
  const { data: completion, error: insertError } = await supabase
    .from("mission_completions")
    .insert({
      user_wallet: wallet,
      mission_instance_id: instanceId || null,
      mission_template_id: templateId || null,
      status: "verifying",
      proof_data: manualProof ? { proof: manualProof } : {},
    })
    .select()
    .single();

  if (insertError) {
    // Check for unique constraint (one-time already done)
    if (insertError.code === "23505") {
      throw new Error("You've already completed this mission!");
    }
    throw insertError;
  }

  // 2. Run verification
  let verificationResult: { verified: boolean; proof: Record<string, any>; message: string };

  if (verificationType.startsWith("on_chain_")) {
    verificationResult = await verifyOnChain(wallet, verificationType, verificationConfig);
  } else if (verificationType.startsWith("x_")) {
    verificationResult = await verifyX(wallet, verificationType, verificationConfig);
  } else if (verificationType === "app_action") {
    // App actions are verified by the fact they happened
    verificationResult = await verifyAppAction(wallet, verificationConfig);
  } else if (verificationType === "manual") {
    // Manual: just accept the proof
    verificationResult = {
      verified: !!manualProof,
      proof: { manual_proof: manualProof },
      message: manualProof ? "Proof submitted" : "No proof provided",
    };
  } else {
    verificationResult = {
      verified: false,
      proof: {},
      message: `Unknown verification type: ${verificationType}`,
    };
  }

  // 3. Update completion with result
  const now = new Date().toISOString();
  const newStatus = verificationResult.verified ? "verified" : "failed";

  const { data: updated, error: updateError } = await supabase
    .from("mission_completions")
    .update({
      status: newStatus,
      proof_data: verificationResult.proof,
      verification_result: verificationResult,
      xp_awarded: verificationResult.verified ? xpReward : 0,
      completed_at: verificationResult.verified ? now : null,
      verified_at: verificationResult.verified ? now : null,
    })
    .eq("id", completion.id)
    .select()
    .single();

  if (updateError) {
    console.error("[MissionEngine] Update completion error:", updateError);
    throw updateError;
  }

  // 4. If verified, award XP
  if (verificationResult.verified) {
    await awardXP(wallet, xpReward);
  }

  return updated as MissionCompletion;
}

// ─── Award XP ────────────────────────────────────────
async function awardXP(wallet: string, amount: number): Promise<void> {
  // Get current XP
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("xp")
    .eq("wallet", wallet)
    .single();

  if (fetchError) {
    console.error("[MissionEngine] Fetch user XP error:", fetchError);
    return;
  }

  const newXP = (user?.xp || 0) + amount;

  const { error: updateError } = await supabase
    .from("users")
    .update({ xp: newXP, updated_at: new Date().toISOString() })
    .eq("wallet", wallet);

  if (updateError) {
    console.error("[MissionEngine] Award XP error:", updateError);
  }
}

// ─── Verify App Action ───────────────────────────────
async function verifyAppAction(
  wallet: string,
  config: Record<string, any>
): Promise<{ verified: boolean; proof: Record<string, any>; message: string }> {
  const action = config.action;

  switch (action) {
    case "link_x": {
      const xLink = await loadXLink();
      return {
        verified: !!xLink,
        proof: xLink ? { x_username: xLink.x_username } : {},
        message: xLink ? `X account @${xLink.x_username} linked` : "X account not linked",
      };
    }

    case "set_username": {
      const { data: user } = await supabase
        .from("users")
        .select("username")
        .eq("wallet", wallet)
        .single();

      const hasUsername = !!user?.username && user.username.trim().length > 0;
      return {
        verified: hasUsername,
        proof: hasUsername ? { username: user!.username } : {},
        message: hasUsername ? `Username set: ${user!.username}` : "Username not set",
      };
    }

    case "first_connect": {
      // If they're calling this, they're connected
      return {
        verified: true,
        proof: { wallet },
        message: "Wallet connected",
      };
    }

    default:
      return {
        verified: false,
        proof: {},
        message: `Unknown app action: ${action}`,
      };
  }
}
