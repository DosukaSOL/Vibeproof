/**
 * StatsPanel Component
 * Display user stats and progression with animated counters + XP progress bar
 */
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { RankBadge } from "@/components/RankBadge";
import { LocalUser } from "@/lib/localStore";
import { getNextRankXp, getRankForXp, getRankProgress } from "@/lib/ranks";
import { T } from "@/lib/theme";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

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

  const xpInLevel = user.xp % 1000;
  const xpProgress = xpInLevel / 1000;
  const rank = getRankForXp(user.xp);
  const nextRankXp = getNextRankXp(user.xp);
  const rankProgress = getRankProgress(user.xp);

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.title}>Your Stats</Text>
        <RankBadge xp={user.xp} size="medium" />
      </View>

      {/* Rank Progress */}
      {nextRankXp !== null && (
        <View style={styles.xpBarSection}>
          <View style={styles.xpBarHeader}>
            <Text style={styles.xpLevelLabel}>{rank.name}</Text>
            <Text style={styles.xpLevelLabel}>
              {Math.round(rankProgress * 100)}% to next rank
            </Text>
          </View>
          <View style={styles.xpBarTrack}>
            <XpBarFill progress={rankProgress} />
          </View>
        </View>
      )}

      {/* XP Progress Bar */}
      <View style={styles.xpBarSection}>
        <View style={styles.xpBarHeader}>
          <AnimatedNumber
            value={user.xp}
            style={styles.xpTotal}
            suffix=" XP"
            duration={1000}
          />
          <Text style={styles.xpLevelLabel}>
            Level {user.level} → {user.level + 1}
          </Text>
        </View>
        <View style={styles.xpBarTrack}>
          <XpBarFill progress={xpProgress} />
        </View>
        <Text style={styles.xpBarSubtext}>
          {xpInLevel} / 1,000 XP to next level
        </Text>
      </View>

      <View style={styles.gridContainer}>
        <StatItem label="Level" value={user.level} icon="📈" />
        <StatItem label="XP" value={user.xp} icon="⭐" />
        <StatItem label="Rank" value={user.rank} icon="🏆" prefix="#" />
        <StatItem label="Streak" value={user.streak} icon="🔥" suffix="d" />
        <StatItem label="Missions" value={user.missionsCompleted} icon="🎯" />
      </View>
    </View>
  );
}

/** Animated XP progress bar fill */
function XpBarFill({ progress }: { progress: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.xpBarFill,
        {
          width: width.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        },
      ]}
    />
  );
}

interface StatItemProps {
  label: string;
  value: number;
  icon: string;
  prefix?: string;
  suffix?: string;
}

function StatItem({ label, value, icon, prefix, suffix }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <AnimatedNumber
        value={value}
        style={styles.statValue}
        prefix={prefix}
        suffix={suffix}
        duration={800}
      />
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
  // XP Progress Bar
  xpBarSection: {
    gap: 6,
  },
  xpBarHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "baseline" as const,
  },
  xpTotal: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: T.xp,
  },
  xpLevelLabel: {
    fontSize: 12,
    color: T.textSec,
    fontWeight: "600" as const,
  },
  xpBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: T.surface2,
    overflow: "hidden" as const,
  },
  xpBarFill: {
    height: "100%" as any,
    borderRadius: 4,
    backgroundColor: T.xp,
  },
  xpBarSubtext: {
    fontSize: 11,
    color: T.textMuted,
  },
  // Grid
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
