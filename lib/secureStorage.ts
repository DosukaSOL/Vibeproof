/**
 * Secure Storage Wrapper
 *
 * Uses expo-secure-store (Keychain / encrypted SharedPreferences)
 * for sensitive data like OAuth tokens and session info.
 *
 * Includes transparent migration from plain AsyncStorage so
 * existing users don't lose their linked accounts on update.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Save a value to the secure store (hardware-backed encryption).
 */
export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

/**
 * Read a value from the secure store.
 * Falls back to AsyncStorage for one-time migration of legacy data.
 */
export async function secureGet(key: string): Promise<string | null> {
  // Try secure store first
  const secure = await SecureStore.getItemAsync(key);
  if (secure) return secure;

  // Fallback: migrate from legacy AsyncStorage
  try {
    const legacy = await AsyncStorage.getItem(key);
    if (legacy) {
      // Move to secure store and remove from AsyncStorage
      await SecureStore.setItemAsync(key, legacy);
      await AsyncStorage.removeItem(key);
      return legacy;
    }
  } catch {
    // Ignore migration errors — treat as empty
  }

  return null;
}

/**
 * Delete a value from both secure store and AsyncStorage (belt & suspenders).
 */
export async function secureRemove(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
  // Also clean up any legacy AsyncStorage entry
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Best-effort
  }
}
