import { Audio } from "expo-av";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const [done, setDone] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Plain RN Animated values — no Reanimated, no worklets, no UI-thread issues
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

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

    // Logo fade + scale in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 8,
        stiffness: 100,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotate (delayed)
    setTimeout(() => {
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 200);

    // Text fade + slide in (delayed)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          damping: 12,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    // Pulse logo
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.08,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    // Fade out entire screen
    setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2000);

    // Navigate after animation
    const timer = setTimeout(() => setDone(true), 2500);
    return () => {
      clearTimeout(timer);
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // Navigate via useEffect — runs AFTER mount, after navigation context is ready
  useEffect(() => {
    if (done) {
      try {
        router.replace("/(tabs)/profile");
      } catch (e) {
        console.error("[Splash] Navigation failed:", e);
        // Retry once after a short delay
        setTimeout(() => {
          try { router.replace("/(tabs)/profile"); } catch {}
        }, 500);
      }
    }
  }, [done]);

  if (done) {
    // Show blank dark screen while router.replace is processing
    return <View style={styles.container} />;
  }

  const rotateInterp = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { rotate: rotateInterp }],
          }}
        >
          <Image
            source={require("@/assets/vpicon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          }}
        >
          <Text style={styles.title}>VibeProof</Text>
          <Text style={styles.subtitle}>Prove Your Vibe on Solana</Text>
        </Animated.View>
      </View>

      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslateY }],
        }}
      >
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
