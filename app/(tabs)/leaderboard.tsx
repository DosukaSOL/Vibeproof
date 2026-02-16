/**
 * Leaderboard Tab
 * See top users by XP
 */
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useWallet } from "@/hooks/useWallet";
import { formatWalletAddress } from "@/lib/solana";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    View
} from "react-native";

export default function LeaderboardScreen() {
  const { address, isConnected } = useWallet();
  const { users, isLoading, hasMore, error, loadMore, refresh } =
    useLeaderboard(isConnected ? address : null);

  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const renderLeaderboardRow = (_: any, index: number) => {
    const user = users[index];
    if (!user) return null;

    const isCurrentUser = user.wallet === address;
    const level = Math.floor(user.xp / 1000) + 1;

    return (
      <View
        key={user.wallet}
        style={[styles.row, isCurrentUser && styles.currentUserRow]}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rank}>#{index + 1}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {user.username || formatWalletAddress(user.wallet)}
          </Text>
          <Text style={styles.wallet}>{formatWalletAddress(user.wallet)}</Text>
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
    );
  };

  const itemCount = users.length + (hasMore && !isLoading ? 1 : 0);
  const shouldShowLoadMore = hasMore && !isLoading && users.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Ranked by XP</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF00" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyTitle}>No Users Yet</Text>
          <Text style={styles.emptyText}>
            Be the first to complete missions and join the leaderboard!
          </Text>
        </View>
      ) : (
        <FlatList
          data={Array.from({ length: itemCount })}
          renderItem={({ index }) => renderLeaderboardRow({}, index)}
          keyExtractor={() => Math.random().toString()}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
        />
      )}

      {shouldShowLoadMore && (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color="#00FF00" />
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
    backgroundColor: "#FFF",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
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
    color: "#666",
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  currentUserRow: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0EA5E9",
    borderWidth: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: "center" as const,
  },
  rank: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#00FF00",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#000",
  },
  wallet: {
    fontSize: 12,
    color: "#999",
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
    color: "#999",
    fontWeight: "600" as const,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#000",
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
    color: "#000",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
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
    color: "#666",
  },
};
