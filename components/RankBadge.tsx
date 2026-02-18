/**
 * RankBadge — displays the user's rank tier (Bronze/Silver/Gold/Platinum/Diamond).
 */
import { getRankForXp } from "@/lib/ranks";
import { Text, View } from "react-native";

interface RankBadgeProps {
  xp: number;
  size?: "small" | "medium" | "large";
}

export function RankBadge({ xp, size = "medium" }: RankBadgeProps) {
  const rank = getRankForXp(xp);

  const sizeConfig = {
    small: { icon: 14, text: 10, px: 6, py: 2 },
    medium: { icon: 16, text: 12, px: 8, py: 4 },
    large: { icon: 20, text: 14, px: 10, py: 6 },
  }[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: rank.bg,
          borderColor: rank.color,
          paddingHorizontal: sizeConfig.px,
          paddingVertical: sizeConfig.py,
        },
      ]}
    >
      <Text style={{ fontSize: sizeConfig.icon }}>{rank.icon}</Text>
      <Text
        style={[
          styles.name,
          { color: rank.color, fontSize: sizeConfig.text },
        ]}
      >
        {rank.name}
      </Text>
    </View>
  );
}

const styles = {
  badge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  name: {
    fontWeight: "700" as const,
  },
};
