/**
 * User Profile Screen
 * View another user's profile from the leaderboard.
 * Accessed via router.push({ pathname: "/user-profile", params: { ... } })
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { FadeInView } from "@/components/FadeInView";
import { UserAvatar } from "@/components/UserAvatar";
import { formatWalletAddress } from "@/lib/solana";
import { T } from "@/lib/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Share, Text, View } from "react-native";

export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    wallet: string;
    username: string;
    xp: string;
    level: string;
    streak: string;
    rank: string;
    avatarUri: string;
  }>();

  const wallet = params.wallet || "";
  const username = params.username || "";
  const xp = parseInt(params.xp || "0", 10);
  const level = parseInt(params.level || "1", 10);
  const streak = parseInt(params.streak || "0", 10);
  const rank = parseInt(params.rank || "0", 10);
  const avatarUri = params.avatarUri || "";
  const missionsCompleted = Math.floor(xp / 25); // estimate

  const handleShare = async () => {
    try {
      const displayName = username || formatWalletAddress(wallet);
      await Share.share({
        message: `🎮 Check out ${displayName} on VibeProof!\n\n🏆 Rank #${rank}\n⭐ Level ${level}\n✨ ${xp} XP\n🔥 ${streak}-day streak\n\nJoin VibeProof — proof-of-action gaming on Solana!\nhttps://vibeproof.app`,
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      {/* Back button */}
      <FadeInView index={0}>
        <AnimatedPressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </AnimatedPressable>
      </FadeInView>

      {/* Profile header */}
      <FadeInView index={1}>
        <View style={s.profileCard}>
          <UserAvatar
            uri={avatarUri || undefined}
            name={username || wallet}
            size={88}
          />
          <Text style={s.displayName}>
            {username || formatWalletAddress(wallet)}
          </Text>
          <Text style={s.walletText}>{formatWalletAddress(wallet, 8)}</Text>
          {rank > 0 && (
            <View style={s.rankBadge}>
              <Text style={s.rankText}>🏆 Rank #{rank}</Text>
            </View>
          )}
        </View>
      </FadeInView>

      {/* Stats grid */}
      <FadeInView index={2}>
        <View style={s.statsGrid}>
          <StatBox label="Level" value={level.toString()} icon="⭐" />
          <StatBox label="Total XP" value={xp.toLocaleString()} icon="✨" />
          <StatBox label="Streak" value={`${streak}d`} icon="🔥" />
          <StatBox label="Missions" value={missionsCompleted.toString()} icon="🎯" />
        </View>
      </FadeInView>

      {/* XP Progress */}
      <FadeInView index={3}>
        <View style={s.card}>
          <Text style={s.cardTitle}>XP Progress</Text>
          <View style={s.xpBarBg}>
            <View
              style={[
                s.xpBarFill,
                { width: `${((xp % 1000) / 1000) * 100}%` },
              ]}
            />
          </View>
          <Text style={s.xpSubtext}>
            {xp % 1000} / 1000 XP to Level {level + 1}
          </Text>
        </View>
      </FadeInView>

      {/* Share button */}
      <FadeInView index={4}>
        <AnimatedPressable onPress={handleShare} style={s.shareBtn}>
          <Text style={s.shareBtnText}>📤 Share Profile</Text>
        </AnimatedPressable>
      </FadeInView>
    </ScrollView>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    backgroundColor: T.bg,
    minHeight: "100%" as any,
  },
  backBtn: {
    alignSelf: "flex-start" as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: T.accent,
    fontWeight: "600" as const,
  },
  profileCard: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 24,
    alignItems: "center" as const,
    gap: 8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: T.text,
    marginTop: 8,
  },
  walletText: {
    fontSize: 13,
    color: T.textMuted,
    fontFamily: undefined,
  },
  rankBadge: {
    backgroundColor: T.accentBg,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: T.rL,
    marginTop: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: T.accent,
  },
  statsGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    minWidth: "45%" as any,
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    alignItems: "center" as const,
    gap: 4,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: T.text,
  },
  statLabel: {
    fontSize: 12,
    color: T.textSec,
    fontWeight: "600" as const,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  xpBarBg: {
    height: 10,
    backgroundColor: T.surface2,
    borderRadius: 5,
    overflow: "hidden" as const,
  },
  xpBarFill: {
    height: 10,
    backgroundColor: T.xp,
    borderRadius: 5,
  },
  xpSubtext: {
    fontSize: 12,
    color: T.textSec,
  },
  shareBtn: {
    backgroundColor: T.accent,
    paddingVertical: 14,
    borderRadius: T.rXL,
    alignItems: "center" as const,
    marginTop: 16,
  },
  shareBtnText: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 15,
  },
};
