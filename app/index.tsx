import { Audio } from "expo-av";
import { Redirect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  const [done, setDone] = useState(false);

  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const pulseScale = useSharedValue(1);
  const screenOpacity = useSharedValue(1);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ALL hooks must be called unconditionally, BEFORE any early return
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

  useEffect(() => {
    // Play chime
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/chime.wav"),
          { shouldPlay: true, volume: 0.7 }
        );
        soundRef.current = sound;
      } catch (e) {
        console.warn("[Splash] Audio:", e);
      }
    })();

    // Animations
    logoOpacity.value = withTiming(1, { duration: 400 });
    logoScale.value = withSpring(1, { damping: 8, stiffness: 100, mass: 0.8 });

    logoRotate.value = withDelay(
      200,
      withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    textOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    textTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 12, stiffness: 100 })
    );

    pulseScale.value = withDelay(
      1000,
      withSequence(
        withTiming(1.08, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      )
    );

    screenOpacity.value = withDelay(2000, withTiming(0, { duration: 400 }));

    // Navigate after animation completes
    const timer = setTimeout(() => setDone(true), 2500);
    return () => {
      clearTimeout(timer);
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Declarative navigation — AFTER all hooks
  if (done) {
    return <Redirect href="/(tabs)/profile" />;
  }

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
    backgroundColor: "#0D1117",
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
    color: "#3FB950",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B949E",
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    fontSize: 12,
    color: "#484F58",
    textAlign: "center",
    marginBottom: 40,
  },
});
