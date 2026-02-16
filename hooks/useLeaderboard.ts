/**
 * useLeaderboard Hook
 * Loads leaderboard from Supabase with graceful local fallback.
 */
import { getLocalUser } from "@/lib/localStore";
import { useCallback, useEffect, useState } from "react";

export interface LeaderboardUser {
  wallet: string;
  username: string;
  xp: number;
  streak: number;
  rank: number;
  level: number;
}

export function useLeaderboard(walletAddress: string | null) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let leaderboardUsers: LeaderboardUser[] = [];
      let fromSupabase = false;

      // Try Supabase first
      try {
        const { supabase } = require("@/lib/supabase");
        const { data, error: dbError } = await supabase
          .from("users")
          .select("wallet, username, xp, streak, rank, level")
          .order("xp", { ascending: false })
          .limit(50);
        if (!dbError && data && data.length > 0) {
          leaderboardUsers = data.map((u: any, idx: number) => ({
            wallet: u.wallet || "",
            username: u.username || "",
            xp: u.xp || 0,
            streak: u.streak || 0,
            rank: idx + 1,
            level: Math.floor((u.xp || 0) / 1000) + 1,
          }));
          fromSupabase = true;
        }
      } catch {
        // Supabase not available — use local fallback
      }

      // Fallback: show local user only
      if (!fromSupabase && walletAddress) {
        const localUser = await getLocalUser(walletAddress);
        if (localUser) {
          leaderboardUsers = [
            {
              wallet: localUser.wallet,
              username: localUser.username || "You",
              xp: localUser.xp,
              streak: localUser.streak,
              rank: 1,
              level: localUser.level,
            },
          ];
        }
      }

      let rank = 0;
      if (walletAddress) {
        const idx = leaderboardUsers.findIndex(
          (u) => u.wallet === walletAddress
        );
        rank = idx >= 0 ? idx + 1 : 0;
      }

      setUsers(leaderboardUsers);
      setUserRank(rank);
    } catch (e: any) {
      setError(e?.message || "Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {}, []);
  const refresh = useCallback(async () => {
    await load();
  }, [load]);
  const getUserPosition = useCallback(
    (wallet: string) => users.findIndex((u) => u.wallet === wallet),
    [users]
  );

  return {
    users,
    userRank,
    isLoading,
    hasMore,
    error,
    loadMore,
    refresh,
    getUserPosition,
  };
}
