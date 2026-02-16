/**
 * MissionCard Component
 * Display individual mission with animations + haptics
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { SPRING } from "@/lib/animations";
import { hapticError, hapticXpGained } from "@/lib/haptics";
import { DbMission } from "@/lib/supabase";
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

interface MissionCardProps {
  mission: DbMission;
  isCompleted: boolean;
  isSubmitting?: boolean;
  onSubmit: (proof: string) => Promise<void>;
}

export function MissionCard({
  mission,
  isCompleted,
  isSubmitting = false,
  onSubmit,
}: MissionCardProps) {
  const [showProofInput, setShowProofInput] = useState(false);
  const [proof, setProof] = useState("");

  // XP reward pop animation
  const xpScale = useSharedValue(1);
  const xpAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
  }));

  const handleSubmit = async () => {
    if (!proof.trim()) {
      await hapticError();
      Alert.alert("Missing proof", "Please provide proof of completion");
      return;
    }

    try {
      await onSubmit(proof.trim());
      await hapticXpGained();
      // Pop the XP badge
      xpScale.value = withSequence(
        withSpring(1.4, SPRING.bouncy),
        withSpring(1, SPRING.default)
      );
      Alert.alert("Success", "Mission completion submitted!");
      setProof("");
      setShowProofInput(false);
    } catch (error: any) {
      await hapticError();
      Alert.alert("Error", error?.message || "Failed to submit completion");
    }
  };

  const getMissionIcon = () => {
    switch (mission.mission_type) {
      case "follow":
        return "👥";
      case "post":
        return "📝";
      case "join":
        return "🚀";
      case "verify":
        return "✅";
      default:
        return "⭐";
    }
  };

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{getMissionIcon()}</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{mission.title}</Text>
          {isCompleted && <Text style={styles.completedBadge}>✓ Completed</Text>}
        </View>
      </View>

      {mission.description && (
        <Text style={styles.description}>{mission.description}</Text>
      )}

      <View style={styles.footer}>
        <Animated.View style={xpAnimStyle}>
          <Text style={styles.xpReward}>+{mission.xp_reward} XP</Text>
        </Animated.View>

        {!isCompleted && (
          <>
            {!showProofInput ? (
              <AnimatedPressable
                onPress={() => setShowProofInput(true)}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Complete</Text>
              </AnimatedPressable>
            ) : (
              <View style={styles.proofInputContainer}>
                <TextInput
                  placeholder="Proof (URL, ID, or message)"
                  value={proof}
                  onChangeText={setProof}
                  editable={!isSubmitting}
                  style={styles.proofInput}
                  placeholderTextColor="#999"
                />
                <AnimatedPressable
                  onPress={handleSubmit}
                  disabled={isSubmitting || !proof.trim()}
                  style={{
                    ...styles.confirmButton,
                    ...((isSubmitting || !proof.trim()) ? styles.confirmButtonDisabled : {}),
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Submit</Text>
                  )}
                </AnimatedPressable>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = {
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "white",
    gap: 10,
  },
  completedCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
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
    color: "#000",
  },
  completedBadge: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600" as const,
  },
  description: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 8,
  },
  xpReward: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#00FF00",
  },
  submitButton: {
    backgroundColor: "#00FF00",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  submitButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  proofInputContainer: {
    flex: 1,
    flexDirection: "row" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  proofInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#000",
  },
  confirmButton: {
    backgroundColor: "#00FF00",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    alignItems: "center" as const,
  },
  confirmButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  confirmButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
};
