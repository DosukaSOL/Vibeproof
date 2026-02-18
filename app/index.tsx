import { hasSeenOnboarding } from "@/lib/localStore";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  const soundRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Plain RN Animated values — no Reanimated, no worklets, no UI-thread issues
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    mountedRef.current = true;

    // Play chime — lazy require so expo-av native module doesn't init at import time
    (async () => {
      try {
        const { Audio } = require("expo-av");
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/sounds/chime.wav"),
          { shouldPlay: true, volume: 0.7 }
        );
        // Guard: if unmounted while loading, release immediately
        if (!mountedRef.current) {
          sound.unloadAsync().catch(() => {});
          return;
        }
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
    const timer = setTimeout(() => {
      if (mountedRef.current) setDone(true);
    }, 2500);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      // Stop + unload synchronously before unmount completes
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Navigate via useEffect — stop audio FIRST, then navigate
  useEffect(() => {
    if (done) {
      (async () => {
        // Ensure audio is fully stopped before navigating
        try {
          if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch {
          // Ignore audio cleanup errors
        }

        // Small delay to let native audio resources release
        await new Promise((r) => setTimeout(r, 50));

        // Check onboarding
        const seen = await hasSeenOnboarding();
        const destination = seen ? "/(tabs)/profile" : "/onboarding";

        try {
          router.replace(destination as any);
        } catch (e) {
          console.error("[Splash] Navigation failed:", e);
          setTimeout(() => {
            try { router.replace(destination as any); } catch {}
          }, 500);
        }
      })();
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
