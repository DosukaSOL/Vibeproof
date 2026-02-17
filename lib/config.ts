/**
 * Configuration for VibeProof
 */

export const CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  X_CLIENT_ID: process.env.EXPO_PUBLIC_X_CLIENT_ID || "",
  GITHUB_CLIENT_ID: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID || "",
  SOLANA_CLUSTER: "mainnet-beta" as const,
  APP_SCHEME: "vibeproof",
  APP_NAME: "VibeProof",
  APP_ICON_URI: "https://vibeproof.app/icon.png",
  WALLET_TIMEOUT_MS: 30000,
  XP_PER_MISSION: 100,
  LEVEL_UP_XP: 1000,
} as const;

export function validateConfig() {
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const;
  const missing = [];

  for (const key of required) {
    if (!CONFIG[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(", ")}. Some features may not work.`
    );
    return false;
  }
  return true;
}
