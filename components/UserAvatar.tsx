/**
 * UserAvatar Component
 * Reusable avatar circle — shows profile photo or fallback initials.
 * Uses expo-image for efficient caching.
 */
import { Text, View, ViewStyle } from "react-native";

let ExpoImage: any = null;
try {
  ExpoImage = require("expo-image").Image;
} catch {
  // expo-image not available
}

interface UserAvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export function UserAvatar({ uri, name, size = 48, style }: UserAvatarProps) {
  const initials = getInitials(name);
  const fontSize = Math.max(size * 0.38, 12);

  if (uri && ExpoImage) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }, style]}>
        <ExpoImage
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  // Fallback: colored circle with initials
  const bgColor = getColorForName(name || "?");
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ color: "#fff", fontSize, fontWeight: "700" }}>
        {initials}
      </Text>
    </View>
  );
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getColorForName(name: string): string {
  const colors = ["#3FB950", "#58A6FF", "#BC8CFF", "#F0883E", "#F85149", "#D29922"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
