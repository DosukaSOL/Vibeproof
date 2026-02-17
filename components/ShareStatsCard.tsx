/**
 * ShareStatsCard Component
 * Generates and shares a text-based achievement card.
 * Uses React Native's built-in Share API — no extra dependencies.
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { LocalUser } from "@/lib/localStore";
import { formatWalletAddress } from "@/lib/solana";
import { T } from "@/lib/theme";
import { useState } from "react";
import { ActivityIndicator, Share, Text, View } from "react-native";

interface ShareStatsCardProps {
  user: LocalUser;
}

export function ShareStatsCard({ user }: ShareStatsCardProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const displayName = user.username || formatWalletAddress(user.wallet);
      const level = Math.floor(user.xp / 1000) + 1;

      const message = [
        `🎮 VibeProof Achievement Card`,
        ``,
        `👤 ${displayName}`,
        `⭐ Level ${level}`,
        `✨ ${user.xp.toLocaleString()} XP`,
        `🔥 ${user.streak}-day streak`,
        `🎯 ${user.missionsCompleted} missions completed`,
        ``,
        `Join VibeProof — proof-of-action gaming on Solana!`,
        `https://vibeproof.app`,
      ].join("\n");

      await Share.share({
        message,
        title: "My VibeProof Stats",
      });
    } catch {
      // User cancelled or error — ignore
    } finally {
      setIsSharing(false);
    }
  };

  const level = Math.floor(user.xp / 1000) + 1;
  const xpInLevel = user.xp % 1000;

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>🎮 Achievement Card</Text>

      <View style={s.preview}>
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Level</Text>
          <Text style={s.previewValue}>⭐ {level}</Text>
        </View>
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Total XP</Text>
          <Text style={s.previewValue}>✨ {user.xp.toLocaleString()}</Text>
        </View>
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Streak</Text>
          <Text style={s.previewValue}>🔥 {user.streak}d</Text>
        </View>
        <View style={s.previewRow}>
          <Text style={s.previewLabel}>Missions</Text>
          <Text style={s.previewValue}>🎯 {user.missionsCompleted}</Text>
        </View>

        {/* Mini XP bar */}
        <View style={s.xpBarContainer}>
          <View style={s.xpBarBg}>
            <View style={[s.xpBarFill, { width: `${(xpInLevel / 1000) * 100}%` }]} />
          </View>
          <Text style={s.xpBarText}>{xpInLevel}/1000 to next level</Text>
        </View>
      </View>

      <AnimatedPressable
        onPress={handleShare}
        disabled={isSharing}
        style={s.shareBtn}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={s.shareBtnText}>📤 Share My Stats</Text>
        )}
      </AnimatedPressable>
    </View>
  );
}

const s = {
  card: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  preview: {
    backgroundColor: T.surface2,
    borderRadius: T.rS,
    padding: 14,
    gap: 10,
  },
  previewRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  previewLabel: {
    fontSize: 13,
    color: T.textSec,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: T.text,
  },
  xpBarContainer: {
    marginTop: 4,
    gap: 4,
  },
  xpBarBg: {
    height: 6,
    backgroundColor: T.bg,
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  xpBarFill: {
    height: 6,
    backgroundColor: T.xp,
    borderRadius: 3,
  },
  xpBarText: {
    fontSize: 11,
    color: T.textMuted,
  },
  shareBtn: {
    backgroundColor: T.accent,
    paddingVertical: 12,
    borderRadius: T.rXL,
    alignItems: "center" as const,
  },
  shareBtnText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 14,
  },
};
