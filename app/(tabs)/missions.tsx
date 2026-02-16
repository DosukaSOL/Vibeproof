/**
 * Missions Tab
 * Complete missions to earn XP — with Repeatable / One-time tabs
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { EngineMissionCard } from "@/components/EngineMissionCard";
import { FadeInView } from "@/components/FadeInView";
import { MissionTab, useMissionEngine } from "@/hooks/useMissionEngine";
import { useWallet } from "@/hooks/useWallet";
import { hapticSelection } from "@/lib/haptics";
import { T } from "@/lib/theme";
import React, { useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

export default function MissionsScreen() {
  const { address, isConnected } = useWallet();
  const engine = useMissionEngine(isConnected ? address : null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await engine.refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabSwitch = (tab: MissionTab) => {
    hapticSelection();
    engine.setActiveTab(tab);
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Wallet Not Connected</Text>
          <Text style={styles.emptyText}>
            Connect your Solana wallet in the Profile tab to start completing
            missions.
          </Text>
        </View>
      </View>
    );
  }

  const repeatableCount = engine.repeatableMissions.length;
  const oneTimeCount = engine.oneTimeMissions.length;
  const isRepeatable = engine.activeTab === "repeatable";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={T.accent} colors={[T.accent]} progressBackgroundColor={T.surface} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Missions</Text>
        <Text style={styles.subtitle}>Earn XP by completing actions</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <AnimatedPressable
          onPress={() => handleTabSwitch("repeatable")}
          enableHaptics={false}
          style={{
            ...styles.tab,
            ...(isRepeatable ? styles.tabActive : {}),
          }}
        >
          <Text style={{
            ...styles.tabText,
            ...(isRepeatable ? styles.tabTextActive : {}),
          }}>
            Daily ({repeatableCount})
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => handleTabSwitch("one_time")}
          enableHaptics={false}
          style={{
            ...styles.tab,
            ...(!isRepeatable ? styles.tabActive : {}),
          }}
        >
          <Text style={{
            ...styles.tabText,
            ...(!isRepeatable ? styles.tabTextActive : {}),
          }}>
            One-time ({oneTimeCount})
          </Text>
        </AnimatedPressable>
      </View>

      {engine.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{engine.error}</Text>
        </View>
      )}

      {engine.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={T.accent} />
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : isRepeatable ? (
        /* ─── Repeatable Missions ─── */
        repeatableCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>No Missions Today</Text>
            <Text style={styles.emptyText}>
              Check back tomorrow for new daily missions!
            </Text>
          </View>
        ) : (
          <View style={styles.missionsGrid}>
            {engine.repeatableMissions.map((mission, index) => (
              <FadeInView key={mission.id} index={index}>
                <EngineMissionCard
                  mission={mission}
                  isCompleted={engine.isInstanceCompleted(mission.id)}
                  verificationStatus={engine.getVerificationStatus(mission.id)}
                  onVerify={() => engine.verifyInstance(mission)}
                  onSubmitProof={(proof) =>
                    engine.submitManualProof(
                      { instanceId: mission.id },
                      proof,
                      mission.verification_type,
                      mission.verification_config,
                      mission.xp_reward
                    )
                  }
                />
              </FadeInView>
            ))}
          </View>
        )
      ) : (
        /* ─── One-Time Missions ─── */
        oneTimeCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏅</Text>
            <Text style={styles.emptyTitle}>All Done!</Text>
            <Text style={styles.emptyText}>
              You've completed all one-time missions. Check repeatable missions
              for more XP!
            </Text>
          </View>
        ) : (
          <View style={styles.missionsGrid}>
            {engine.oneTimeMissions.map((template, index) => (
              <FadeInView key={template.id} index={index}>
                <EngineMissionCard
                  mission={template}
                  isCompleted={engine.isOneTimeCompleted(template.id)}
                  verificationStatus={engine.getVerificationStatus(template.id)}
                  onVerify={() => engine.verifyOneTime(template)}
                  isOneTime
                />
              </FadeInView>
            ))}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = {
  container: {
    minHeight: "100%" as any,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.bg,
  },
  header: {
    marginBottom: 12,
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
  tabContainer: {
    flexDirection: "row" as const,
    backgroundColor: T.surface,
    borderRadius: T.r,
    padding: 4,
    marginBottom: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: T.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center" as const,
  },
  tabActive: {
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: T.textMuted,
  },
  tabTextActive: {
    color: T.text,
  },
  errorBox: {
    backgroundColor: T.errorBg,
    borderRadius: T.rS,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.error,
  },
  errorText: {
    color: T.error,
    fontSize: 13,
  },
  loadingContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: T.textSec,
  },
  missionsGrid: {
    gap: 12,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 80,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: T.text,
  },
  emptyText: {
    fontSize: 14,
    color: T.textSec,
    textAlign: "center" as const,
    maxWidth: 280,
    lineHeight: 18,
  },
};
