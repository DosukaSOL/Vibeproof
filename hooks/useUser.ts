/**
 * useUser Hook
 * Manages user profile and auth state
 */
import {
    DbUser,
    getUser,
    isUsernameAvailable,
    updateUsername,
} from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export interface UserState {
  user: DbUser | null;
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

        const userData = await getUser(walletAddress);
        setState((prev) => ({
          ...prev,
          user: userData,
          isLoading: false,
        }));
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

        const updated = await updateUsername(walletAddress, newUsername);
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
   * Check if username is available
   */
  const checkUsernameAvailable = useCallback(
    async (username: string) => {
      try {
        return await isUsernameAvailable(username);
      } catch (error) {
        console.error("[useUser] Username check error:", error);
        return false;
      }
    },
    []
  );

  /**
   * Refresh user data
   */
  const refresh = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const userData = await getUser(walletAddress);
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

  return {
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
    setUsername,
    checkUsernameAvailable,
    refresh,
  };
}
