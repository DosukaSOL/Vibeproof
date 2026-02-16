import { Audio } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const pulseScale = useSharedValue(1);
  const screenOpacity = useSharedValue(1);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Play chime sound
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/chime.wav"),
          { shouldPlay: true, volume: 0.7 }
        );
        soundRef.current = sound;
      } catch (e) {
        console.warn("[Splash] Audio error:", e);
      }
    })();

    // 1. Logo fades in + bouncy scale from 0 → 1
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, {
      damping: 8,
      stiffness: 100,
      mass: 0.8,
    });

    // 2. Logo does a smooth spin (360°)
    logoRotate.value = withDelay(
      200,
      withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    // 3. Text slides up + fades in
    textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    // 4. Gentle pulse on logo
    pulseScale.value = withDelay(
      1000,
      withSequence(
        withTiming(1.08, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      )
    );

    // 5. Fade out the whole screen (visual only — navigation handled by setTimeout)
    screenOpacity.value = withDelay(
      2000,
      withTiming(0, { duration: 400 })
    );

    // 6. Navigate on the JS thread after animation completes
    const navTimer = setTimeout(() => {
      router.replace("/(tabs)/profile" as any);
    }, 2500);

    return () => {
      clearTimeout(navTimer);
      // Unload sound
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * pulseScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenAnimatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={logoAnimatedStyle}>
          <Image
            source={require("@/assets/vpicon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.title}>VibeProof</Text>
          <Text style={styles.subtitle}>Prove Your Vibe on Solana</Text>
        </Animated.View>
      </View>

      <Animated.View style={textAnimatedStyle}>
        <Text style={styles.footer}>Powered by Solana</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#00FF00",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    color: "#444",
    textAlign: "center",
    marginBottom: 40,
  },
});
