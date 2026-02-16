/**
 * useLeaderboard Hook
 * Manages leaderboard state and pagination
 */
import { DbUser, getLeaderboard, getUserRank } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

export interface LeaderboardState {
  users: DbUser[];
  userRank: number;
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
}

const PAGE_SIZE = 50;

export function useLeaderboard(walletAddress: string | null) {
  const [state, setState] = useState<LeaderboardState>({
    users: [],
    userRank: 0,
    isLoading: false,
    hasMore: true,
    page: 0,
    error: null,
  });

  /**
   * Load initial leaderboard
   */
  const load = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        page: 0,
      }));

      const [users, rank] = await Promise.all([
        getLeaderboard(PAGE_SIZE, 0),
        walletAddress ? getUserRank(walletAddress) : Promise.resolve(0),
      ]);

      setState((prev) => ({
        ...prev,
        users,
        userRank: rank,
        isLoading: false,
        hasMore: users.length === PAGE_SIZE,
        page: 0,
      }));
    } catch (error: any) {
      const message = error?.message || "Failed to load leaderboard";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [walletAddress]);

  /**
   * Load leaderboard on mount and when wallet changes
   */
  useEffect(() => {
    load();
  }, [load]);

  /**
   * Load next page
   */
  const loadMore = useCallback(async () => {
    if (!state.hasMore || state.isLoading) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const nextPage = state.page + 1;
      const offset = nextPage * PAGE_SIZE;
      const users = await getLeaderboard(PAGE_SIZE, offset);

      setState((prev) => ({
        ...prev,
        users: [...prev.users, ...users],
        isLoading: false,
        hasMore: users.length === PAGE_SIZE,
        page: nextPage,
      }));
    } catch (error: any) {
      const message = error?.message || "Failed to load more users";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [state.hasMore, state.isLoading, state.page]);

  /**
   * Refresh leaderboard
   */
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  /**
   * Get user's position
   */
  const getUserPosition = useCallback(
    (wallet: string) => {
      return state.users.findIndex((u) => u.wallet === wallet);
    },
    [state.users]
  );

  return {
    users: state.users,
    userRank: state.userRank,
    isLoading: state.isLoading,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    refresh,
    getUserPosition,
  };
}
