/**
 * X OAuth Callback Screen
 * Shown briefly after X account linking completes.
 * Auto-navigates back to profile after a short delay.
 */
import { T } from "@/lib/theme";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

export default function XCallbackScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate back after 2 seconds
    const timer = setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/profile");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={s.container}>
      <Animated.View
        style={[s.card, { transform: [{ scale }], opacity }]}
      >
        <Text style={s.checkmark}>✓</Text>
        <Text style={s.title}>X Account Linked!</Text>
        <Text style={s.subtitle}>Returning to profile…</Text>
      </Animated.View>
    </View>
  );
}

const s = {
  container: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.accent,
    padding: 40,
    alignItems: "center" as const,
    gap: 12,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  checkmark: {
    fontSize: 56,
    color: T.accent,
    fontWeight: "700" as const,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: T.text,
  },
  subtitle: {
    fontSize: 14,
    color: T.textSec,
  },
};
