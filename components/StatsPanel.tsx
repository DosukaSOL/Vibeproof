/**
 * StatsPanel Component
 * Display user stats and progression
 */
import { LocalUser } from "@/lib/localStore";
import { T } from "@/lib/theme";
import React from "react";
import { Text, View } from "react-native";

interface StatsPanelProps {
  user: LocalUser | null;
  isLoading?: boolean;
}

export function StatsPanel({ user, isLoading }: StatsPanelProps) {
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          {isLoading ? "Loading stats..." : "Connect wallet to see stats"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Stats</Text>

      <View style={styles.gridContainer}>
        <StatItem
          label="Level"
          value={user.level.toString()}
          icon="📈"
        />
        <StatItem label="XP" value={user.xp.toString()} icon="⭐" />
        <StatItem label="Rank" value={`#${user.rank}`} icon="🏆" />
        <StatItem label="Streak" value={user.streak.toString()} icon="🔥" />
        <StatItem label="Missions" value={user.missionsCompleted.toString()} icon="🎯" />
      </View>
    </View>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  icon: string;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  container: {
    backgroundColor: T.surface,
    borderRadius: T.rL,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  gridContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    justifyContent: "space-between" as const,
  },
  statItem: {
    flex: 1,
    minWidth: "45%" as any,
    backgroundColor: T.surface2,
    borderRadius: T.r,
    padding: 12,
    alignItems: "center" as const,
    gap: 6,
    borderWidth: 1,
    borderColor: T.borderLight,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: T.xp,
  },
  statLabel: {
    fontSize: 12,
    color: T.textSec,
    fontWeight: "600" as const,
  },
  emptyText: {
    fontSize: 14,
    color: T.textMuted,
    textAlign: "center" as const,
  },
};
