/**
 * XLinkCard Component
 * UI for linking/unlinking X (Twitter) account
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { UseXLinkReturn } from "@/hooks/useXLink";
import { hapticError, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { T } from "@/lib/theme";
import React from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

interface XLinkCardProps {
  xLink: UseXLinkReturn;
}

export function XLinkCard({ xLink }: XLinkCardProps) {
  const { status, isLinking, isUnlinking, error, linkX, unlinkXAccount } = xLink;

  const handleLink = async () => {
    try {
      await linkX();
    } catch (err: any) {
      await hapticError();
      Alert.alert("Error", err?.message || "Failed to link X account");
    }
  };

  const handleUnlink = () => {
    Alert.alert("Unlink X Account", "Are you sure you want to unlink your X account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: async () => {
          try {
            await hapticWarning();
            await unlinkXAccount();
            await hapticSuccess();
          } catch (err: any) {
            await hapticError();
            Alert.alert("Error", err?.message || "Failed to unlink X account");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>𝕏</Text>
        <Text style={styles.cardTitle}>X Account</Text>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {status.isLinked ? (
        <View style={styles.linkedContainer}>
          <View style={styles.linkedInfo}>
            <Text style={styles.linkedLabel}>Linked as</Text>
            <Text style={styles.linkedUsername}>@{status.username}</Text>
            {status.linkedAt && (
              <Text style={styles.linkedDate}>
                Since {new Date(status.linkedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
          <AnimatedPressable
            onPress={handleUnlink}
            disabled={isUnlinking}
            style={{
              ...styles.unlinkButton,
              ...(isUnlinking ? styles.buttonDisabled : {}),
            }}
          >
            {isUnlinking ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text style={styles.unlinkText}>Unlink</Text>
            )}
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.unlinkContainer}>
          <Text style={styles.description}>
            Link your X account to unlock social missions and verify your actions.
          </Text>
          <AnimatedPressable
            onPress={handleLink}
            disabled={isLinking}
            style={{
              ...styles.linkButton,
              ...(isLinking ? styles.buttonDisabled : {}),
            }}
          >
            {isLinking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.linkButtonText}>Link X Account</Text>
            )}
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
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
    fontWeight: "700" as const,
    color: T.text,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  errorText: {
    fontSize: 12,
    color: T.error,
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
  linkedLabel: {
    fontSize: 12,
    color: T.textSec,
  },
  linkedUsername: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: T.text,
  },
  linkedDate: {
    fontSize: 11,
    color: T.textMuted,
  },
  unlinkButton: {
    borderWidth: 1,
    borderColor: T.error,
    borderRadius: T.rL,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  unlinkText: {
    color: T.error,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  unlinkContainer: {
    gap: 10,
  },
  description: {
    fontSize: 13,
    color: T.textSec,
    lineHeight: 18,
  },
  linkButton: {
    backgroundColor: T.text,
    paddingVertical: 11,
    borderRadius: T.rXL,
    alignItems: "center" as const,
  },
  linkButtonText: {
    color: T.bg,
    fontWeight: "700" as const,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
};
