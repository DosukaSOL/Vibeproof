/**
 * Leaderboard Tab
 * See top users by XP — with search + tap to view profiles
 */
import { FadeInView } from "@/components/FadeInView";
import { RankBadge } from "@/components/RankBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useWallet } from "@/hooks/useWallet";

import { formatWalletAddress } from "@/lib/solana";
import { T } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LeaderboardScreen() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { users, isLoading, hasMore, error, loadMore, refresh } =
    useLeaderboard(isConnected ? address : null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.trim().toLowerCase();
    return users.filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.wallet.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEndReached = () => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  };

  const handleUserPress = (user: any, displayRank: number) => {
    router.push({
      pathname: "/user-profile",
      params: {
        wallet: user.wallet,
        username: user.username || "",
        xp: user.xp.toString(),
        level: (Math.floor(user.xp / 1000) + 1).toString(),
        streak: (user.streak || 0).toString(),
        rank: displayRank.toString(),
        avatarUri: user.avatarUri || "",
      },
    });
  };

  const renderLeaderboardRow = (_: any, index: number) => {
    const user = filteredUsers[index];
    if (!user) return null;

    const isCurrentUser = user.wallet === address;
    const level = Math.floor(user.xp / 1000) + 1;
    const globalIndex = users.indexOf(user);
    const displayRank = globalIndex >= 0 ? globalIndex + 1 : index + 1;

    return (
      <FadeInView key={user.wallet} index={Math.min(index, 8)}>
        <TouchableOpacity
          onPress={() => handleUserPress(user, displayRank)}
          activeOpacity={0.7}
        >
          <View style={[styles.row, isCurrentUser && styles.currentUserRow]}>
            <View style={styles.rankContainer}>
              <Text style={styles.rank}>#{displayRank}</Text>
            </View>

            <UserAvatar
              uri={user.avatarUri}
              name={user.username || user.wallet}
              size={36}
            />

            <View style={styles.userInfo}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.username} numberOfLines={1}>
                  {user.username || formatWalletAddress(user.wallet)}
                </Text>
                <RankBadge xp={user.xp} size="small" />
              </View>
              <Text style={styles.wallet}>
                {formatWalletAddress(user.wallet)}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Lvl</Text>
                <Text style={styles.statValue}>{level}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>XP</Text>
                <Text style={styles.statValue}>{user.xp}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  const itemCount = filteredUsers.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Ranked by XP</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by username or wallet..."
          placeholderTextColor={T.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {searchQuery.trim() ? "🔍" : "🏆"}
          </Text>
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() ? "No Results" : "No Users Yet"}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? "No users match your search. Try a different username or wallet address."
              : "Be the first to complete missions and join the leaderboard!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={Array.from({ length: itemCount })}
          renderItem={({ index }) => renderLeaderboardRow({}, index)}
          keyExtractor={(_, index) => index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={T.accent}
              colors={[T.accent]}
              progressBackgroundColor={T.surface}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
        />
      )}

      {hasMore && !isLoading && filteredUsers.length > 0 && !searchQuery.trim() && (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color={T.accent} />
          <Text style={styles.loadMoreText}>Loading more...</Text>
        </View>
      )}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.bg,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: T.text,
  },
  subtitle: {
    fontSize: 14,
    color: T.textSec,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: T.text,
  },
  clearBtn: {
    fontSize: 16,
    color: T.textMuted,
    padding: 4,
  },
  errorBox: {
    backgroundColor: T.errorBg,
    borderRadius: T.rS,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.error,
  },
  errorText: {
    color: T.error,
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 100,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: T.textSec,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: T.surface,
    borderRadius: T.r,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
  },
  currentUserRow: {
    backgroundColor: T.accentBg,
    borderColor: T.accent,
    borderWidth: 2,
  },
  rankContainer: {
    width: 36,
    alignItems: "center" as const,
  },
  rank: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: T.accent,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: T.text,
  },
  wallet: {
    fontSize: 12,
    color: T.textMuted,
  },
  statsContainer: {
    flexDirection: "row" as const,
    gap: 8,
  },
  statBox: {
    alignItems: "center" as const,
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
    color: T.textMuted,
    fontWeight: "600" as const,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: T.xp,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 100,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: T.text,
  },
  emptyText: {
    fontSize: 14,
    color: T.textSec,
    textAlign: "center" as const,
    maxWidth: 280,
    lineHeight: 18,
  },
  loadMoreContainer: {
    alignItems: "center" as const,
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 12,
    color: T.textSec,
  },
};
