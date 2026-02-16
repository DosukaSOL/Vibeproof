/**
 * Missions Tab
 * Complete missions to earn XP
 */
import { MissionCard } from "@/components/MissionCard";
import { useMissions } from "@/hooks/useMissions";
import { useWallet } from "@/hooks/useWallet";
import React, { useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function MissionsScreen() {
  const { address, isConnected } = useWallet();
  const {
    missions,
    isLoading,
    isSubmitting,
    error,
    submitCompletion,
    isCompleted,
    refresh,
  } = useMissions(isConnected ? address : null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = (missionId: string) => async (proof: string) => {
    await submitCompletion(missionId, proof);
    await handleRefresh();
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Wallet Not Connected</Text>
          <Text style={styles.emptyText}>
            Connect your Solana wallet in the Profile tab to start completing
            missions.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Missions</Text>
        <Text style={styles.subtitle}>Earn XP by completing actions</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF00" />
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : missions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✨</Text>
          <Text style={styles.emptyTitle}>No Missions Yet</Text>
          <Text style={styles.emptyText}>
            Check back soon for new missions to complete!
          </Text>
        </View>
      ) : (
        <View style={styles.missionsGrid}>
          {missions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isCompleted={isCompleted(mission.id)}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit(mission.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = {
  container: {
    minHeight: "100%" as any,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  missionsGrid: {
    gap: 12,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 80,
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
};
