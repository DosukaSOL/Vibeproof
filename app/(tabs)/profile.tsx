/**
 * Profile Tab
 * User identity, wallet, and stats
 */
import { StatsPanel } from "@/components/StatsPanel";
import { WalletButton } from "@/components/WalletButton";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@/hooks/useWallet";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

export default function ProfileScreen() {
  const { address, isConnected } = useWallet();
  const { user, isLoading, error, setUsername, refresh } = useUser(
    isConnected ? address : null
  );

  const [newUsername, setNewUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync username when user changes
  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user?.username]);

  const validateUsername = (username: string): boolean => {
    if (!username.trim()) return false;
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const handleSaveUsername = async () => {
    if (!isConnected) {
      Alert.alert("Not connected", "Connect your wallet first.");
      return;
    }

    const trimmed = newUsername.trim();
    if (!validateUsername(trimmed)) {
      Alert.alert(
        "Invalid username",
        "Use 3-20 characters: letters, numbers, underscores"
      );
      return;
    }

    try {
      setIsSaving(true);
      await setUsername(trimmed);
      await hapticSuccess();
      Alert.alert("Success", "Username updated!");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update username");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <FadeInView index={0}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Your Web3 Identity</Text>
        </View>
      </FadeInView>

      {/* Wallet Section */}
      <FadeInView index={1}>
        <WalletButton
          onConnectSuccess={() => {
            Alert.alert("Success", "Wallet connected!");
          }}
          onDisconnectSuccess={() => {
            Alert.alert("Disconnected", "Wallet cleared.");
          }}
        />
      </FadeInView>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Stats Section */}
      <FadeInView index={2}>
        <StatsPanel user={user} isLoading={isLoading} />
      </FadeInView>

      {/* Username Section */}
      {isConnected && (
        <FadeInView index={3}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Username</Text>
            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter your username"
              maxLength={20}
              editable={!isSaving}
              style={styles.input}
              placeholderTextColor="#999"
            />
            <Text style={styles.charCounter}>
              {newUsername.length}/20 characters
            </Text>

            <AnimatedPressable
              onPress={handleSaveUsername}
              disabled={isSaving || !newUsername.trim()}
              style={{
                ...styles.button,
                ...(isSaving ? styles.buttonDisabled : {}),
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Username</Text>
              )}
            </AnimatedPressable>
          </View>
        </FadeInView>
      )}

      {/* Info Section */}
      <FadeInView index={4}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.infoText}>
            VibeProof is a proof-of-action gaming platform on Solana. Complete
            missions, earn XP, and climb the leaderboard!
          </Text>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000",
  },
  charCounter: {
    fontSize: 12,
    color: "#999",
  },
  button: {
    backgroundColor: "#00FF00",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center" as const,
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  buttonText: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
};
