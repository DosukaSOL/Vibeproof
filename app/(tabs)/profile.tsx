/**
 * Profile Tab
 * User identity, wallet, and stats
 */
import { AchievementBadge } from "@/components/AchievementBadge";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { AvatarPicker } from "@/components/AvatarPicker";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FadeInView } from "@/components/FadeInView";
import { GitHubLinkCard } from "@/components/GitHubLinkCard";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ProfileCompletionMeter } from "@/components/ProfileCompletionMeter";
import { RankBadge } from "@/components/RankBadge";
import { ShareStatsCard } from "@/components/ShareStatsCard";
import { StatsPanel } from "@/components/StatsPanel";
import { StreakCard } from "@/components/StreakCard";
import { WalletButton } from "@/components/WalletButton";
import { XLinkCard } from "@/components/XLinkCard";
import { useGitHubLink } from "@/hooks/useGitHubLink";
import { useUser } from "@/hooks/useUser";
import { useWallet } from "@/hooks/useWallet";
import { useXLink } from "@/hooks/useXLink";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { hapticSuccess } from "@/lib/haptics";
import { setupDailyReminder } from "@/lib/notifications";

import { T } from "@/lib/theme";
import { useEffect, useState } from "react";
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
  const { user, isLoading, error, setUsername, setAvatar, refresh, unlockedBadgeIds, completions } = useUser(
    isConnected ? address : null
  );
  const xLink = useXLink(isConnected ? address : null);
  const gitHubLink = useGitHubLink(isConnected ? address : null);

  const [newUsername, setNewUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);



  // Sync username when user changes
  useEffect(() => {
    if (user?.username) {
      setNewUsername(user.username);
    }
  }, [user?.username]);

  // Setup daily notification when connected
  useEffect(() => {
    if (isConnected && user) {
      setupDailyReminder();
    }
  }, [isConnected, user]);

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

  const handleAvatarPicked = async (uri: string) => {
    try {
      await setAvatar(uri);
      await hapticSuccess();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to save photo");
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
    <ErrorBoundary>
      <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={T.accent} colors={[T.accent]} progressBackgroundColor={T.surface} />
      }
    >
      {/* Offline Banner */}
      <OfflineBanner />

      <FadeInView index={0}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={styles.title}>Profile</Text>
            {user && <RankBadge xp={user.xp} size="medium" />}
          </View>
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

      {/* Profile Completion Meter */}
      {isConnected && user && (
        <FadeInView index={2}>
          <ProfileCompletionMeter
            items={[
              { label: "Connect wallet", icon: "🔗", done: true },
              { label: "Set username", icon: "✏️", done: !!user.username },
              { label: "Set avatar", icon: "📷", done: !!user.avatarUri },
              { label: "Link X account", icon: "𝕏", done: xLink.status.isLinked },
              { label: "Link GitHub", icon: "🐙", done: gitHubLink.status.isLinked },
              { label: "Complete a mission", icon: "🎯", done: user.missionsCompleted > 0 },
            ]}
          />
        </FadeInView>
      )}

      {/* Avatar */}
      {isConnected && user && (
        <FadeInView index={3}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Photo</Text>
            <AvatarPicker
              uri={user.avatarUri}
              name={user.username || user.wallet}
              onPicked={handleAvatarPicked}
            />
          </View>
        </FadeInView>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Stats Section */}
      <FadeInView index={4}>
        <StatsPanel user={user} isLoading={isLoading} />
      </FadeInView>

      {/* Streak Card */}
      {isConnected && user && (
        <FadeInView index={5}>
          <StreakCard user={user} />
        </FadeInView>
      )}

      {/* Achievements */}
      {isConnected && user && (
        <FadeInView index={6}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Achievements</Text>
            <View style={styles.badgeGrid}>
              {ACHIEVEMENTS.map((a) => (
                <AchievementBadge
                  key={a.id}
                  achievement={a}
                  unlocked={unlockedBadgeIds.includes(a.id)}
                  compact
                />
              ))}
            </View>
            <Text style={styles.infoText}>
              {unlockedBadgeIds.length}/{ACHIEVEMENTS.length} unlocked
            </Text>
          </View>
        </FadeInView>
      )}

      {/* Activity Feed */}
      {isConnected && completions.length > 0 && (
        <FadeInView index={7}>
          <ActivityFeed completions={completions} />
        </FadeInView>
      )}

      {/* X Account Linking */}
      {isConnected && (
        <FadeInView index={8}>
          <XLinkCard xLink={xLink} />
        </FadeInView>
      )}

      {/* GitHub Account Linking */}
      {isConnected && (
        <FadeInView index={9}>
          <GitHubLinkCard gitHubLink={gitHubLink} />
        </FadeInView>
      )}

      {/* Username Section */}
      {isConnected && (
        <FadeInView index={10}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Username</Text>
            <TextInput
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter your username"
              maxLength={20}
              editable={!isSaving}
              style={styles.input}
              placeholderTextColor={T.textMuted}
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

      {/* Share Achievement Card */}
      {isConnected && user && (
        <FadeInView index={11}>
          <ShareStatsCard user={user} />
        </FadeInView>
      )}

      {/* Info Section */}
      <FadeInView index={12}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.infoText}>
            VibeProof is a proof-of-action gaming platform on Solana. Complete
            missions, earn XP, and climb the leaderboard!
          </Text>
        </View>
      </FadeInView>
    </ScrollView>
    </ErrorBoundary>
  );
}

const styles = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    backgroundColor: T.bg,
    minHeight: "100%" as any,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: T.text,
  },
  subtitle: {
    fontSize: 14,
    color: T.textSec,
    marginTop: 4,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  badgeGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.rS,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: T.text,
    backgroundColor: T.surface2,
  },
  charCounter: {
    fontSize: 12,
    color: T.textMuted,
  },
  button: {
    backgroundColor: T.accent,
    paddingVertical: 12,
    borderRadius: T.rXL,
    alignItems: "center" as const,
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: T.textMuted,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: T.errorBg,
    borderRadius: T.rS,
    padding: 12,
    borderWidth: 1,
    borderColor: T.error,
  },
  errorText: {
    color: T.error,
    fontSize: 13,
  },
  infoText: {
    fontSize: 13,
    color: T.textSec,
    lineHeight: 18,
  },
};
