/**
 * WalletButton Component
 * Display and control wallet connection
 */
import { useWallet } from "@/hooks/useWallet";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

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

  const handleConnect = async () => {
    try {
      const addr = await connect();
      onConnectSuccess?.(addr);
    } catch (err) {
      console.error("[WalletButton] Connect error:", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      onDisconnectSuccess?.();
    } catch (err) {
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
      <Pressable
        onPress={handleConnect}
        style={[styles.button, styles.connectButton]}
      >
        <Text style={styles.buttonText}>Connect Solana Wallet</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.connectedInfo}>
        <Text style={styles.label}>Connected Wallet</Text>
        <Text style={styles.address}>{address}</Text>
      </View>
      <Pressable
        onPress={handleDisconnect}
        style={[styles.button, styles.disconnectButton]}
      >
        <Text style={styles.buttonText}>Disconnect</Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = {
  container: {
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center" as const,
  },
  connectButton: {
    backgroundColor: "#7C3AED",
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
