/**
 * Authentication & Session Management
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "vibeproof_session";

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
    // Store session in AsyncStorage (compatible with all platforms)
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
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
    const sessionStr = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session: Session = JSON.parse(sessionStr);
    return session;
  } catch (error) {
    console.error("[Auth] Failed to load session:", error);
    return null;
  }
}

/**
 * Get wallet address from stored session
 */
export async function getStoredWallet(): Promise<string | null> {
  try {
    const session = await loadSession();
    return session?.walletAddress || null;
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
    await AsyncStorage.removeItem(SESSION_KEY);
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
