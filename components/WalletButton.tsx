/**
 * WalletButton Component
 * Display and control wallet connection with animations + haptics.
 * Uses plain React Native Animated API — NO Reanimated worklets.
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SuccessPopView } from "@/components/SuccessPopView";
import { useWallet } from "@/hooks/useWallet";
import { SPRING } from "@/lib/animations";
import { hapticConnectSuccess, hapticDisconnect, hapticError } from "@/lib/haptics";
import { T } from "@/lib/theme";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";

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
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (justConnected) {
      Animated.spring(glowOpacity, {
        toValue: 1,
        ...SPRING.default,
        useNativeDriver: false, // borderColor can't use native driver
      }).start();
      const timer = setTimeout(() => {
        Animated.spring(glowOpacity, {
          toValue: 0,
          ...SPRING.gentle,
          useNativeDriver: false,
        }).start();
        setJustConnected(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justConnected]);

  const glowBorderColor = glowOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(63,185,80,0)", "rgba(63,185,80,0.7)"],
  });

  const glowBorderWidth = glowOpacity.interpolate({
    inputRange: [0, 0.01, 1],
    outputRange: [1, 2, 2],
  });

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
        <ActivityIndicator size="small" color={T.textSec} />
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
        <Animated.View
          style={[
            styles.connectedInfo,
            { borderColor: glowBorderColor, borderWidth: glowBorderWidth },
          ]}
        >
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
    borderRadius: T.rXL,
    alignItems: "center" as const,
  },
  connectButton: {
    backgroundColor: T.accent,
  },
  disconnectButton: {
    backgroundColor: T.error,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 16,
  },
  connectedInfo: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  label: {
    fontSize: 12,
    color: T.textSec,
    fontWeight: "600" as const,
  },
  address: {
    fontSize: 14,
    color: T.text,
    fontWeight: "700" as const,
  },
  loadingText: {
    fontSize: 14,
    color: T.textSec,
  },
  error: {
    fontSize: 12,
    color: T.error,
  },
};
