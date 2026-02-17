/**
 * StreakCard Component
 * Visual daily login streak tracker with animated fire icon and weekly dots.
 * Uses plain React Native Animated API — NO Reanimated.
 */
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { LocalUser } from "@/lib/localStore";
import { T } from "@/lib/theme";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";

interface StreakCardProps {
  user: LocalUser | null;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakCard({ user }: StreakCardProps) {
  if (!user) return null;

  const streak = user.streak || 0;
  const isActive = streak > 0;

  // Determine which days this week the user was active
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0
  const activeDays = getWeekActiveDays(user.lastActiveDate, streak, dayOfWeek);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <FireIcon isActive={isActive} streak={streak} />
        <View style={styles.streakInfo}>
          <View style={styles.streakValueRow}>
            <AnimatedNumber
              value={streak}
              style={styles.streakNumber}
              duration={600}
            />
            <Text style={styles.streakUnit}>day streak</Text>
          </View>
          <Text style={styles.streakMessage}>
            {getStreakMessage(streak)}
          </Text>
        </View>
      </View>

      {/* Weekly progress dots */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.dayColumn}>
            <View
              style={[
                styles.dayDot,
                activeDays[i] && styles.dayDotActive,
                i === dayOfWeek && styles.dayDotToday,
              ]}
            />
            <Text
              style={[
                styles.dayLabel,
                i === dayOfWeek && styles.dayLabelToday,
              ]}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Streak milestones */}
      {streak >= 3 && (
        <View style={styles.milestoneRow}>
          <Text style={styles.milestoneText}>
            {streak >= 30
              ? "🏆 Legendary!"
              : streak >= 14
                ? "💎 Diamond streak!"
                : streak >= 7
                  ? "⭐ One week strong!"
                  : "🔥 Keep it going!"}
          </Text>
          {streak >= 7 && (
            <Text style={styles.bonusText}>+{getStreakBonus(streak)}% XP bonus</Text>
          )}
        </View>
      )}
    </View>
  );
}

/** Animated fire icon that pulses when streak is active */
function FireIcon({ isActive, streak }: { isActive: boolean; streak: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;

    // Continuous pulse (JS driver — shares node with JS-driven glow color)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );

    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    pulse.start();
    glowAnim.start();

    return () => {
      pulse.stop();
      glowAnim.stop();
    };
  }, [isActive]);

  const glowColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255, 149, 0, 0.0)", "rgba(255, 149, 0, 0.25)"],
  });

  return (
    <Animated.View
      style={[
        styles.fireContainer,
        { transform: [{ scale }], backgroundColor: glowColor },
      ]}
    >
      <Text style={styles.fireEmoji}>{isActive ? "🔥" : "❄️"}</Text>
    </Animated.View>
  );
}

// ─── Helpers ────────────────────────────────────────────

function getStreakMessage(streak: number): string {
  if (streak === 0) return "Open the app daily to start your streak!";
  if (streak === 1) return "You started! Come back tomorrow.";
  if (streak < 3) return "Building momentum...";
  if (streak < 7) return "You're on fire!";
  if (streak < 14) return "One week down — unstoppable!";
  if (streak < 30) return "Two weeks! True dedication.";
  return "Absolute legend. " + streak + " days straight!";
}

function getStreakBonus(streak: number): number {
  if (streak >= 30) return 25;
  if (streak >= 14) return 15;
  if (streak >= 7) return 10;
  return 0;
}

/**
 * Build an array of 7 booleans for Mon–Sun showing active days.
 * Simple heuristic: if streak >= (dayOfWeek - i + 1), that day was active.
 */
function getWeekActiveDays(
  lastActiveDate: string,
  streak: number,
  todayIndex: number // 0=Mon
): boolean[] {
  const days = Array(7).fill(false);
  const today = new Date();
  const lastActive = lastActiveDate
    ? new Date(lastActiveDate + "T12:00:00")
    : null;

  // If not active today, only mark previous days
  const isActiveToday =
    lastActive &&
    lastActive.toISOString().split("T")[0] ===
      today.toISOString().split("T")[0];

  for (let i = 0; i <= todayIndex; i++) {
    const daysAgo = todayIndex - i;
    if (isActiveToday) {
      days[i] = daysAgo < streak;
    } else {
      // Last active was yesterday or earlier
      days[i] = daysAgo > 0 && daysAgo <= streak;
    }
  }

  return days;
}

// ─── Styles ─────────────────────────────────────────────

const styles = {
  container: {
    backgroundColor: T.surface,
    borderRadius: T.rL,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  topRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  fireContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  fireEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
    gap: 2,
  },
  streakValueRow: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
    gap: 6,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "900" as const,
    color: "#FF9500",
  },
  streakUnit: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: T.textSec,
  },
  streakMessage: {
    fontSize: 13,
    color: T.textMuted,
  },
  // Weekly dots
  weekRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingHorizontal: 4,
  },
  dayColumn: {
    alignItems: "center" as const,
    gap: 4,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.borderLight,
  },
  dayDotActive: {
    backgroundColor: "#FF9500",
    borderColor: "#FF9500",
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: T.accent,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: T.textMuted,
  },
  dayLabelToday: {
    color: T.accent,
  },
  // Milestones
  milestoneRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: T.surface2,
    borderRadius: T.rS,
    padding: 10,
  },
  milestoneText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: T.text,
  },
  bonusText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#FF9500",
  },
};
