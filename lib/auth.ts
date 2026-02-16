/**
 * Authentication & Session Management
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "vibeproof_session";
const WALLET_KEY = "vibeproof_wallet";

export type Session = {
  walletAddress: string;
  authToken: string;
  createdAt: number;
};

/**
 * Save session securely
 */
export async function saveSession(session: Session): Promise<void> {
  try {
    // Store wallet in regular storage for quick access
    await AsyncStorage.setItem(WALLET_KEY, session.walletAddress);
    // Store full session in secure storage
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("[Auth] Failed to save session:", error);
    throw error;
  }
}

/**
 * Load session from storage
 */
export async function loadSession(): Promise<Session | null> {
  try {
    const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
    if (!sessionStr) return null;

    const session: Session = JSON.parse(sessionStr);
    return session;
  } catch (error) {
    console.error("[Auth] Failed to load session:", error);
    return null;
  }
}

/**
 * Get wallet address without full session
 */
export async function getStoredWallet(): Promise<string | null> {
  try {
    const wallet = await AsyncStorage.getItem(WALLET_KEY);
    return wallet;
  } catch (error) {
    console.error("[Auth] Failed to get wallet:", error);
    return null;
  }
}

/**
 * Clear all stored session data
 */
export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WALLET_KEY);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear session:", error);
    throw error;
  }
}

/**
 * Check if session is still valid (basic check)
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await loadSession();
  if (!session) return false;

  // Sessions valid for 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - session.createdAt;
  return ageMs < thirtyDaysMs;
}
