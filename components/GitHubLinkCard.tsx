/**
 * GitHubLinkCard Component
 * UI for linking/unlinking GitHub account
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { UseGitHubLinkReturn } from "@/hooks/useGitHubLink";
import { hapticError, hapticSuccess, hapticWarning } from "@/lib/haptics";
import { T } from "@/lib/theme";
import { ActivityIndicator, Alert, Text, View } from "react-native";

interface GitHubLinkCardProps {
  gitHubLink: UseGitHubLinkReturn;
}

export function GitHubLinkCard({ gitHubLink }: GitHubLinkCardProps) {
  const { status, isLinking, isUnlinking, error, linkGitHub, unlinkGitHubAccount } = gitHubLink;

  const handleLink = async () => {
    try {
      await linkGitHub();
    } catch (err: any) {
      await hapticError();
      Alert.alert("Error", err?.message || "Failed to link GitHub account");
    }
  };

  const handleUnlink = () => {
    Alert.alert("Unlink GitHub", "Are you sure you want to unlink your GitHub account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: async () => {
          try {
            await hapticWarning();
            await unlinkGitHubAccount();
            await hapticSuccess();
          } catch (err: any) {
            await hapticError();
            Alert.alert("Error", err?.message || "Failed to unlink GitHub account");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>🐙</Text>
        <Text style={styles.cardTitle}>GitHub Account</Text>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {status.isLinked ? (
        <View style={styles.linkedContainer}>
          <View style={styles.linkedInfo}>
            <Text style={styles.linkedLabel}>Linked as</Text>
            <Text style={styles.linkedUsername}>{status.username}</Text>
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
            Link your GitHub account to unlock developer missions and show it on
            your profile.
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
              <Text style={styles.linkButtonText}>Link GitHub</Text>
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
    fontSize: 22,
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
    paddingVertical: 8,
  },
  unlinkText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: T.error,
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
    backgroundColor: "#24292e",
    paddingVertical: 12,
    borderRadius: T.rXL,
    alignItems: "center" as const,
  },
  linkButtonText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
};
