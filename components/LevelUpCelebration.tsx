/**
 * LevelUpCelebration — full-screen overlay for level-up events.
 * Animated confetti-like particles, bouncy text, auto-dismiss.
 * Uses plain RN Animated — NO Reanimated.
 */
import { playSound } from "@/lib/sounds";
import { T } from "@/lib/theme";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Text, TouchableOpacity, View } from "react-native";

const { width, height } = Dimensions.get("window");
const PARTICLE_COUNT = 12;

interface LevelUpCelebrationProps {
  level: number;
  visible: boolean;
  onDismiss: () => void;
}

export function LevelUpCelebration({ level, visible, onDismiss }: LevelUpCelebrationProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const textScale = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Play level-up sound
    playSound("level_up");

    // Fade in background
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Bounce in the level badge
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.2,
        damping: 8,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Text entrance
    setTimeout(() => {
      Animated.spring(textScale, {
        toValue: 1,
        damping: 10,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    }, 200);

    // Confetti particles
    particles.forEach((p, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const distance = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      setTimeout(() => {
        Animated.parallel([
          Animated.spring(p.scale, { toValue: 1, damping: 8, stiffness: 200, useNativeDriver: true }),
          Animated.timing(p.x, { toValue: targetX, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.y, { toValue: targetY, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 800, delay: 400, useNativeDriver: true }),
        ]).start();
      }, i * 50);
    });

    // Auto-dismiss after 3s
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  const PARTICLE_EMOJIS = ["✨", "🌟", "⭐", "💫", "🎉", "🎊", "🔥", "💎", "🏆", "⚡", "🎯", "🚀"];

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onDismiss}
      style={styles.overlay}
    >
      <Animated.View style={[styles.overlay, { opacity }]}>
        <View style={styles.backdrop} />

        {/* Confetti particles */}
        {particles.map((p, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.particle,
              {
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                ],
                opacity: p.opacity,
              },
            ]}
          >
            {PARTICLE_EMOJIS[i % PARTICLE_EMOJIS.length]}
          </Animated.Text>
        ))}

        {/* Level badge */}
        <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
          <Text style={styles.levelUp}>LEVEL UP!</Text>
          <Text style={styles.levelNumber}>{level}</Text>
        </Animated.View>

        {/* Sub text */}
        <Animated.View style={{ transform: [{ scale: textScale }] }}>
          <Text style={styles.subText}>Keep going! 🚀</Text>
        </Animated.View>

        <Text style={styles.tapHint}>Tap to continue</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = {
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    zIndex: 9999,
  },
  backdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  particle: {
    position: "absolute" as const,
    fontSize: 24,
  },
  badge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: T.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: 24,
  },
  levelUp: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: "#fff",
    letterSpacing: 2,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: "900" as const,
    color: "#fff",
  },
  subText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: T.text,
    textAlign: "center" as const,
  },
  tapHint: {
    position: "absolute" as const,
    bottom: 80,
    fontSize: 14,
    color: T.textMuted,
  },
};
