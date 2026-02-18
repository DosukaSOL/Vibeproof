/**
 * AchievementBadge — displays a single achievement badge.
 * Supports locked/unlocked states with rarity color coding.
 */
import { Achievement, RARITY_META } from "@/lib/achievements";
import { T } from "@/lib/theme";
import { Text, View } from "react-native";

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  compact?: boolean;
}

export function AchievementBadge({
  achievement,
  unlocked,
  compact = false,
}: AchievementBadgeProps) {
  const rarity = RARITY_META[achievement.rarity];

  if (compact) {
    return (
      <View
        style={[
          styles.compactBadge,
          unlocked
            ? { backgroundColor: rarity.bg, borderColor: rarity.color }
            : styles.locked,
        ]}
      >
        <Text style={[styles.compactIcon, !unlocked && styles.lockedIcon]}>
          {unlocked ? achievement.icon : "🔒"}
        </Text>
        <Text
          style={[
            styles.compactName,
            unlocked ? { color: rarity.color } : styles.lockedText,
          ]}
          numberOfLines={1}
        >
          {achievement.name}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        unlocked
          ? { backgroundColor: rarity.bg, borderColor: rarity.color }
          : styles.locked,
      ]}
    >
      <Text style={[styles.icon, !unlocked && styles.lockedIcon]}>
        {unlocked ? achievement.icon : "🔒"}
      </Text>
      <Text
        style={[
          styles.name,
          unlocked ? { color: T.text } : styles.lockedText,
        ]}
        numberOfLines={1}
      >
        {achievement.name}
      </Text>
      <Text
        style={[
          styles.description,
          !unlocked && styles.lockedText,
        ]}
        numberOfLines={2}
      >
        {achievement.description}
      </Text>
      {unlocked && (
        <Text style={[styles.rarityLabel, { color: rarity.color }]}>
          {rarity.label}
        </Text>
      )}
    </View>
  );
}

const styles = {
  badge: {
    width: "48%" as any,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center" as const,
    gap: 4,
    marginBottom: 8,
  },
  locked: {
    backgroundColor: T.surface2,
    borderColor: T.borderLight,
    opacity: 0.5,
  },
  icon: {
    fontSize: 28,
  },
  lockedIcon: {
    opacity: 0.4,
  },
  name: {
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
  description: {
    fontSize: 10,
    color: T.textSec,
    textAlign: "center" as const,
    lineHeight: 14,
  },
  lockedText: {
    color: T.textMuted,
  },
  rarityLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  // Compact variant
  compactBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  compactIcon: {
    fontSize: 14,
  },
  compactName: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
};
