/**
 * WalletButton Component
 * Display and control wallet connection with animations + haptics
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SuccessPopView } from "@/components/SuccessPopView";
import { useWallet } from "@/hooks/useWallet";
import { SPRING } from "@/lib/animations";
import { hapticConnectSuccess, hapticDisconnect, hapticError } from "@/lib/haptics";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface WalletButtonProps {
  onConnectSuccess?: (address: string) => void;
  onDisconnectSuccess?: () => void;
}

export function WalletButton({
  onConnectSuccess,
  onDisconnectSuccess,
}: WalletButtonProps) {
  const { address, isConnected, isLoading, error, connect, disconnect } =
    useWallet();
  const [justConnected, setJustConnected] = useState(false);

  // Animated green glow after connect
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (justConnected) {
      glowOpacity.value = withSpring(1, SPRING.default);
      const timer = setTimeout(() => {
        glowOpacity.value = withSpring(0, SPRING.gentle);
        setJustConnected(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justConnected]);

  const glowStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(0, 255, 0, ${glowOpacity.value * 0.6})`,
    borderWidth: glowOpacity.value > 0.01 ? 2 : 1,
  }));

  const handleConnect = async () => {
    try {
      const addr = await connect();
      await hapticConnectSuccess();
      setJustConnected(true);
      onConnectSuccess?.(addr);
    } catch (err) {
      await hapticError();
      console.error("[WalletButton] Connect error:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      await hapticDisconnect();
      onDisconnectSuccess?.();
    } catch (err) {
      await hapticError();
      console.error("[WalletButton] Disconnect error:", err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadingText}>Checking wallet...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <AnimatedPressable
        onPress={handleConnect}
        style={{ ...styles.button, ...styles.connectButton }}
      >
        <Text style={styles.buttonText}>Connect Solana Wallet</Text>
      </AnimatedPressable>
    );
  }

  return (
    <SuccessPopView trigger={justConnected}>
      <View style={styles.container}>
        <Animated.View style={[styles.connectedInfo, glowStyle]}>
          <Text style={styles.label}>Connected Wallet</Text>
          <Text style={styles.address}>{address}</Text>
        </Animated.View>
        <AnimatedPressable
          onPress={handleDisconnect}
          style={{ ...styles.button, ...styles.disconnectButton }}
        >
          <Text style={styles.buttonText}>Disconnect</Text>
        </AnimatedPressable>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </SuccessPopView>
  );
}

const styles = {
  container: {
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center" as const,
  },
  connectButton: {
    backgroundColor: "#00FF00",
  },
  disconnectButton: {
    backgroundColor: "#EF4444",
  },
  buttonText: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: 16,
  },
  connectedInfo: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600" as const,
  },
  address: {
    fontSize: 14,
    color: "#000",
    fontWeight: "700" as const,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  error: {
    fontSize: 12,
    color: "#EF4444",
  },
};
