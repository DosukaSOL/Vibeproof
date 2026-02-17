/**
 * Secure Storage Wrapper
 *
 * Tries expo-secure-store (Keychain / encrypted SharedPreferences)
 * for sensitive data like OAuth tokens and session info.
 * Falls back gracefully to AsyncStorage if the native module is
 * unavailable, so the app never crashes on startup.
 *
 * Includes transparent migration from plain AsyncStorage so
 * existing users don't lose their linked accounts on update.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// Lazy-load SecureStore to avoid crash if native module isn't ready
let _SecureStore: typeof import("expo-secure-store") | null = null;
function getSecureStore() {
  if (_SecureStore === null) {
    try {
      _SecureStore = require("expo-secure-store");
    } catch {
      _SecureStore = undefined as any; // mark as attempted
    }
  }
  return _SecureStore || null;
}

/**
 * Save a value — SecureStore when available, AsyncStorage as fallback.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  const ss = getSecureStore();
  if (ss) {
    try {
      await ss.setItemAsync(key, value);
      return;
    } catch {
      // SecureStore write failed — fall through to AsyncStorage
    }
  }
  await AsyncStorage.setItem(key, value);
}

/**
 * Read a value from the secure store.
 * Falls back to AsyncStorage for one-time migration of legacy data.
 */
export async function secureGet(key: string): Promise<string | null> {
  const ss = getSecureStore();

  // Try secure store first
  if (ss) {
    try {
      const secure = await ss.getItemAsync(key);
      if (secure) return secure;
    } catch {
      // SecureStore read failed — continue to AsyncStorage
    }
  }

  // Fallback / migration: read from AsyncStorage
  try {
    const legacy = await AsyncStorage.getItem(key);
    if (legacy && ss) {
      // Migrate to secure store and clean up
      try {
        await ss.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
      } catch {
        // Migration failed — data stays in AsyncStorage, still usable
      }
    }
    return legacy;
  } catch {
    return null;
  }
}

/**
 * Delete a value from both secure store and AsyncStorage (belt & suspenders).
 */
export async function secureRemove(key: string): Promise<void> {
  const ss = getSecureStore();
  if (ss) {
    try {
      await ss.deleteItemAsync(key);
    } catch {
      // Best-effort
    }
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Best-effort
  }
}
