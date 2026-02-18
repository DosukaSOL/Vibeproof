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
  avatarUri?: string;
}

export function useLeaderboard(walletAddress: string | null) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 25;

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
          .select("*")
          .order("xp", { ascending: false })
          .range(0, PAGE_SIZE - 1);
        if (!dbError && data && data.length > 0) {
          leaderboardUsers = data.map((u: any, idx: number) => ({
            wallet: u.wallet || "",
            username: u.username || "",
            xp: u.xp || 0,
            streak: u.streak || 0,
            rank: idx + 1,
            level: Math.floor((u.xp || 0) / 1000) + 1,
            avatarUri: u.avatar_url || undefined,
          }));
          fromSupabase = true;
          setHasMore(data.length >= PAGE_SIZE);
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
              avatarUri: localUser.avatarUri || undefined,
            },
          ];
        }
      }

      // Merge current user's local data so their username/avatar is always fresh
      if (fromSupabase && walletAddress) {
        try {
          const localUser = await getLocalUser(walletAddress);
          if (localUser) {
            const idx = leaderboardUsers.findIndex(
              (u) => u.wallet === walletAddress
            );
            if (idx >= 0) {
              // Overlay local username and avatar onto Supabase data
              if (localUser.username) {
                leaderboardUsers[idx].username = localUser.username;
              }
              if (localUser.avatarUri) {
                leaderboardUsers[idx].avatarUri = localUser.avatarUri;
              }
              if (localUser.xp > leaderboardUsers[idx].xp) {
                leaderboardUsers[idx].xp = localUser.xp;
              }
            } else {
              // Current user not in Supabase yet — add them
              leaderboardUsers.push({
                wallet: localUser.wallet,
                username: localUser.username || "",
                xp: localUser.xp,
                streak: localUser.streak,
                rank: leaderboardUsers.length + 1,
                level: Math.floor(localUser.xp / 1000) + 1,
                avatarUri: localUser.avatarUri || undefined,
              });
              // Re-sort by XP
              leaderboardUsers.sort((a, b) => b.xp - a.xp);
              leaderboardUsers.forEach((u, i) => (u.rank = i + 1));
            }
          }
        } catch {
          // Non-fatal — local merge failed
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

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    try {
      setIsLoading(true);
      const offset = users.length;
      const { supabase } = require("@/lib/supabase");
      const { data, error: dbError } = await supabase
        .from("users")
        .select("*")
        .order("xp", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (!dbError && data && data.length > 0) {
        const newUsers: LeaderboardUser[] = data.map((u: any, idx: number) => ({
          wallet: u.wallet || "",
          username: u.username || "",
          xp: u.xp || 0,
          streak: u.streak || 0,
          rank: offset + idx + 1,
          level: Math.floor((u.xp || 0) / 1000) + 1,
          avatarUri: u.avatar_url || undefined,
        }));
        setUsers((prev) => [...prev, ...newUsers]);
        setHasMore(data.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, users.length]);
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
