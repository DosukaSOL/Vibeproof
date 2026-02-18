/**
 * ProfileCompletionMeter — shows progress toward completing the user profile.
 * Checks: wallet, username, avatar, X link, GitHub link, first mission.
 */
import { T } from "@/lib/theme";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

interface ProfileCompletionItem {
  label: string;
  icon: string;
  done: boolean;
}

interface ProfileCompletionMeterProps {
  items: ProfileCompletionItem[];
}

export function ProfileCompletionMeter({ items }: ProfileCompletionMeterProps) {
  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const progress = total > 0 ? completed / total : 0;

  if (progress >= 1) return null; // All done — hide the meter

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile Completion</Text>
        <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
      </View>

      <View style={styles.barTrack}>
        <ProgressFill progress={progress} />
      </View>

      <View style={styles.checklist}>
        {items.map((item) => (
          <View key={item.label} style={styles.checkItem}>
            <Text style={styles.checkIcon}>
              {item.done ? "✅" : "⬜"}
            </Text>
            <Text
              style={[
                styles.checkLabel,
                item.done && styles.checkLabelDone,
              ]}
            >
              {item.icon} {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ProgressFill({ progress }: { progress: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={[
        styles.barFill,
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

const styles = {
  container: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  title: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: T.text,
  },
  percent: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: T.accent,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: T.surface2,
    overflow: "hidden" as const,
  },
  barFill: {
    height: "100%" as any,
    borderRadius: 3,
    backgroundColor: T.accent,
  },
  checklist: {
    gap: 4,
  },
  checkItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  checkIcon: {
    fontSize: 12,
  },
  checkLabel: {
    fontSize: 12,
    color: T.textSec,
  },
  checkLabelDone: {
    color: T.textMuted,
    textDecorationLine: "line-through" as const,
  },
};
