/**
 * ActivityFeed — scrollable timeline of recent XP-earning activities.
 * Shows mission completions, badge unlocks, and milestones.
 */
import { LocalCompletion } from "@/lib/localStore";
import { T } from "@/lib/theme";
import { Text, View } from "react-native";

interface ActivityFeedProps {
  completions: LocalCompletion[];
  maxItems?: number;
}

export function ActivityFeed({ completions, maxItems = 10 }: ActivityFeedProps) {
  // Sort by most recent first
  const sorted = [...completions]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>
            Complete missions to see your activity here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      {sorted.map((item, index) => (
        <View key={`${item.missionId}_${item.completedAt}_${index}`} style={styles.item}>
          <View style={styles.dot} />
          {index < sorted.length - 1 && <View style={styles.line} />}
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>
              {formatMissionName(item.missionId)}
            </Text>
            <View style={styles.itemMeta}>
              <Text style={styles.xpText}>+{item.xpAwarded} XP</Text>
              <Text style={styles.timeText}>{formatTimeAgo(item.completedAt)}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatMissionName(id: string): string {
  // Remove date suffix from daily missions (e.g., daily_tx_2026-02-18 → daily_tx)
  const baseId = id.replace(/_\d{4}-\d{2}-\d{2}$/, "");
  const names: Record<string, string> = {
    daily_tx: "Made a Transaction",
    daily_balance: "HODL Check",
    daily_checkin: "Daily Check-in",
    daily_explore: "Explored Solana",
    daily_transfer: "Sent SOL",
    daily_nft_check: "NFT Portfolio Check",
    daily_defi_interact: "DeFi Interaction",
    daily_swap: "Token Swap",
    daily_stake_check: "Staking Check",
    daily_social_share: "Social Share",
    daily_profile_visit: "Profile Visit",
    daily_leaderboard_check: "Leaderboard Check",
    daily_wallet_check: "Wallet Health Check",
    ot_connect: "Connected Wallet",
    ot_username: "Set Username",
    ot_link_x: "Linked X Account",
    ot_diamond_hands: "Diamond Hands",
    ot_link_github: "Linked GitHub",
    ot_star_repo: "Starred Repo",
    ot_github_follow: "Followed on GitHub",
    ot_first_daily: "First Daily Mission",
    ot_avatar: "Set Avatar",
    weekly_5_missions: "Weekly: 5 Missions",
    weekly_3_checkins: "Weekly: 3 Check-ins",
    weekly_earn_500: "Weekly: Earn 500 XP",
    weekly_all_daily: "Weekly: All Dailies",
  };
  return names[baseId] || baseId.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function formatTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString();
}

const styles = {
  container: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  item: {
    flexDirection: "row" as const,
    gap: 10,
    minHeight: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.accent,
    marginTop: 5,
  },
  line: {
    position: "absolute" as const,
    left: 3,
    top: 15,
    bottom: -4,
    width: 2,
    backgroundColor: T.borderLight,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: T.text,
  },
  itemMeta: {
    flexDirection: "row" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  xpText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: T.xp,
  },
  timeText: {
    fontSize: 11,
    color: T.textMuted,
  },
  empty: {
    alignItems: "center" as const,
    padding: 16,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 13,
    color: T.textMuted,
    textAlign: "center" as const,
  },
};
