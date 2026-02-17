/**
 * useUser Hook
 * Manages user profile using local storage (offline-first).
 * Optionally syncs to Supabase in background.
 */
import {
    createLocalUser,
    getLocalUser,
    LocalUser,
    updateAvatarUri,
    updateLocalUsername,
} from "@/lib/localStore";
import { useCallback, useEffect, useState } from "react";

export interface UserState {
  user: LocalUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useUser(walletAddress: string | null) {
  const [state, setState] = useState<UserState>({
    user: null,
    isLoading: false,
    error: null,
  });

  /**
   * Fetch user data when wallet changes
   */
  useEffect(() => {
    if (!walletAddress) {
      setState({ user: null, isLoading: false, error: null });
      return;
    }

    (async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        // Get or create local user
        const userData = await createLocalUser(walletAddress);
        setState((prev) => ({
          ...prev,
          user: userData,
          isLoading: false,
        }));

        // Try Supabase sync in background (non-blocking)
        trySyncToSupabase(walletAddress, userData);
      } catch (error: any) {
        const message = error?.message || "Failed to load user";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    })();
  }, [walletAddress]);

  /**
   * Update user's username
   */
  const setUsername = useCallback(
    async (newUsername: string) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const updated = await updateLocalUsername(walletAddress, newUsername);
        setState((prev) => ({
          ...prev,
          user: updated,
          isLoading: false,
        }));
        return updated;
      } catch (error: any) {
        const message = error?.message || "Failed to update username";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    [walletAddress]
  );

  /**
   * Refresh user data from local store
   */
  const refresh = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const userData = await getLocalUser(walletAddress);
      setState((prev) => ({
        ...prev,
        user: userData,
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error?.message || "Failed to refresh user";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [walletAddress]);

  /**
   * Update user's avatar
   */
  const setAvatar = useCallback(
    async (uri: string) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      try {
        const updated = await updateAvatarUri(walletAddress, uri);
        setState((prev) => ({ ...prev, user: updated }));
        return updated;
      } catch (error: any) {
        console.warn("[useUser] setAvatar error:", error?.message);
        throw error;
      }
    },
    [walletAddress]
  );

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    setUsername,
    setAvatar,
    refresh,
  };
}

/**
 * Try to sync local user to Supabase in background.
 * Non-blocking, never throws.
 */
async function trySyncToSupabase(wallet: string, user: LocalUser) {
  try {
    const { supabase } = require("@/lib/supabase");
    await supabase.from("users").upsert(
      {
        wallet,
        username: user.username || null,
        xp: user.xp,
        streak: user.streak,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet" }
    );
  } catch {
    // Supabase not available — that's fine, local data is the source of truth
  }
}
