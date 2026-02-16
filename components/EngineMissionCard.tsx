/**
 * EngineMissionCard Component
 * Mission card for the new mission engine with auto-verification + status
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SPRING } from "@/lib/animations";
import { hapticError, hapticXpGained } from "@/lib/haptics";
import { MissionTemplate } from "@/lib/missionTemplates";
import { T } from "@/lib/theme";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";

type VerifyStatus = "idle" | "verifying" | "verified" | "failed";

interface EngineMissionCardProps {
  mission: MissionTemplate;
  isCompleted: boolean;
  verificationStatus: VerifyStatus;
  onVerify: () => Promise<any>;
  onSubmitProof?: (proof: string) => Promise<any>;
  isOneTime?: boolean;
}

export function EngineMissionCard({
  mission,
  isCompleted,
  verificationStatus,
  onVerify,
  onSubmitProof,
  isOneTime = false,
}: EngineMissionCardProps) {
  const [showProofInput, setShowProofInput] = useState(false);
  const [proof, setProof] = useState("");

  const xpScale = useSharedValue(1);
  const xpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const isManual = mission.verification_type === "manual";
  const isAutoVerifiable =
    mission.verification_type.startsWith("on_chain_") ||
    mission.verification_type.startsWith("x_") ||
    mission.verification_type === "app_action";

  const getMissionIcon = () => {
    const type = mission.verification_type;
    if (type.startsWith("on_chain_")) return "⛓️";
    if (type.startsWith("x_")) return "𝕏";
    if (type === "app_action") return "📱";
    if (type === "manual") return "📝";
    return "⭐";
  };

  const getStatusBadge = () => {
    if (isCompleted) return { text: "✓ Completed", color: "#22C55E" };
    switch (verificationStatus) {
      case "verifying":
        return { text: "⏳ Verifying...", color: "#F59E0B" };
      case "verified":
        return { text: "✅ Verified!", color: "#22C55E" };
      case "failed":
        return { text: "❌ Failed", color: "#EF4444" };
      default:
        return null;
    }
  };

  const handleAutoVerify = async () => {
    try {
      const result = await onVerify();
      if (result?.status === "verified") {
        await hapticXpGained();
        xpScale.value = withSequence(
          withSpring(1.4, SPRING.bouncy),
          withSpring(1, SPRING.default)
        );
      } else {
        await hapticError();
        Alert.alert("Verification Failed", result?.verification_result?.message || "Could not verify. Try again later.");
      }
    } catch (error: any) {
      await hapticError();
      Alert.alert("Error", error?.message || "Verification failed");
    }
  };

  const handleManualSubmit = async () => {
    if (!proof.trim()) {
      await hapticError();
      Alert.alert("Missing proof", "Please provide proof of completion");
      return;
    }
    try {
      if (onSubmitProof) {
        const result = await onSubmitProof(proof.trim());
        if (result?.status === "verified") {
          await hapticXpGained();
          xpScale.value = withSequence(
            withSpring(1.4, SPRING.bouncy),
            withSpring(1, SPRING.default)
          );
        }
      }
      setProof("");
      setShowProofInput(false);
    } catch (error: any) {
      await hapticError();
      Alert.alert("Error", error?.message || "Submission failed");
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getMissionIcon()}</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{mission.title}</Text>
          {statusBadge && (
            <Text style={[styles.statusBadge, { color: statusBadge.color }]}>
              {statusBadge.text}
            </Text>
          )}
          {isOneTime && !isCompleted && (
            <Text style={styles.oneTimeBadge}>One-time</Text>
          )}
        </View>
      </View>

      {mission.description && (
        <Text style={styles.description}>{mission.description}</Text>
      )}

      <View style={styles.footer}>
        <Animated.View style={xpAnimStyle}>
          <Text style={styles.xpReward}>+{mission.xp_reward} XP</Text>
        </Animated.View>

        {!isCompleted && verificationStatus !== "verified" && (
          <>
            {isAutoVerifiable ? (
              <AnimatedPressable
                onPress={handleAutoVerify}
                disabled={verificationStatus === "verifying"}
                style={{
                  ...styles.verifyButton,
                  ...(verificationStatus === "verifying" ? styles.buttonDisabled : {}),
                }}
              >
                {verificationStatus === "verifying" ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {verificationStatus === "failed" ? "Retry" : "Verify"}
                  </Text>
                )}
              </AnimatedPressable>
            ) : isManual ? (
              <>
                {!showProofInput ? (
                  <AnimatedPressable
                    onPress={() => setShowProofInput(true)}
                    style={styles.verifyButton}
                  >
                    <Text style={styles.verifyButtonText}>Submit Proof</Text>
                  </AnimatedPressable>
                ) : (
                  <View style={styles.proofContainer}>
                    <TextInput
                      placeholder="Proof (URL, ID, or message)"
                      value={proof}
                      onChangeText={setProof}
                      style={styles.proofInput}
                      placeholderTextColor={T.textMuted}
                    />
                    <AnimatedPressable
                      onPress={handleManualSubmit}
                      disabled={!proof.trim()}
                      style={{
                        ...styles.submitButton,
                        ...(!proof.trim() ? styles.buttonDisabled : {}),
                      }}
                    >
                      <Text style={styles.submitButtonText}>Submit</Text>
                    </AnimatedPressable>
                  </View>
                )}
              </>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = {
  card: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.r,
    padding: 12,
    backgroundColor: T.surface,
    gap: 10,
  },
  completedCard: {
    backgroundColor: T.successBg,
    borderColor: T.accentDim,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
  },
  icon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: T.text,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  oneTimeBadge: {
    fontSize: 11,
    color: T.purple,
    fontWeight: "600" as const,
    backgroundColor: T.purpleBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start" as const,
    overflow: "hidden" as const,
  },
  description: {
    fontSize: 13,
    color: T.textSec,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 4,
  },
  xpReward: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: T.xp,
  },
  verifyButton: {
    backgroundColor: T.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: T.rL,
    minWidth: 70,
    alignItems: "center" as const,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  proofContainer: {
    flex: 1,
    flexDirection: "row" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  proofInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.rS,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: T.text,
    backgroundColor: T.surface2,
  },
  submitButton: {
    backgroundColor: T.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: T.rL,
    minWidth: 60,
    alignItems: "center" as const,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
  },
};
