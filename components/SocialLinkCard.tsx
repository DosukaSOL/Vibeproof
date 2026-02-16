/**
 * SocialLinkCard — card for linking Telegram/Discord accounts
 * Uses deep links to open the native app, then confirms via user prompt.
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { hapticSuccess } from "@/lib/haptics";
import React from "react";
import { ActivityIndicator, Alert, Linking, Text, View } from "react-native";

interface SocialLinkCardProps {
  provider: "telegram" | "discord";
  title: string;
  icon: string;
  joinUrl: string;
  isLinked: boolean;
  linkedUsername?: string;
  isLinking: boolean;
  onLink: () => void;
  onUnlink: () => void;
}

export function SocialLinkCard({
  provider,
  title,
  icon,
  joinUrl,
  isLinked,
  linkedUsername,
  isLinking,
  onLink,
  onUnlink,
}: SocialLinkCardProps) {
  const handleJoin = async () => {
    try {
      await Linking.openURL(joinUrl);
      // After opening the link, prompt to confirm
      setTimeout(() => {
        Alert.alert(
          `Joined ${title}?`,
          `Did you join our ${title} community?`,
          [
            { text: "Not yet", style: "cancel" },
            {
              text: "Yes, I joined!",
              onPress: async () => {
                await hapticSuccess();
                onLink();
              },
            },
          ]
        );
      }, 2000);
    } catch {
      Alert.alert("Error", `Could not open ${title} link. Please try again.`);
    }
  };

  const handleUnlink = () => {
    Alert.alert(`Unlink ${title}`, `Remove your ${title} link?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: onUnlink },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {isLinked ? (
        <View style={styles.linkedContainer}>
          <View style={styles.linkedInfo}>
            <Text style={styles.linkedBadge}>✓ Joined</Text>
            {linkedUsername ? (
              <Text style={styles.linkedUsername}>{linkedUsername}</Text>
            ) : null}
          </View>
          <AnimatedPressable onPress={handleUnlink} style={styles.unlinkButton}>
            <Text style={styles.unlinkText}>Unlink</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.unlinkContainer}>
          <Text style={styles.description}>
            Join the VibeProof {title} community to earn XP!
          </Text>
          <AnimatedPressable
            onPress={handleJoin}
            disabled={isLinking}
            style={{
              ...styles.linkButton,
              ...(isLinking ? styles.buttonDisabled : {}),
            }}
          >
            {isLinking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.linkButtonText}>Join {title}</Text>
            )}
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  linkedContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  linkedInfo: {
    gap: 2,
    flex: 1,
  },
  linkedBadge: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "600" as const,
  },
  linkedUsername: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#000",
  },
  unlinkButton: {
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  unlinkText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  unlinkContainer: {
    gap: 10,
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  linkButton: {
    backgroundColor: "#000",
    paddingVertical: 11,
    borderRadius: 20,
    alignItems: "center" as const,
  },
  linkButtonText: {
    color: "white",
    fontWeight: "700" as const,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
};
