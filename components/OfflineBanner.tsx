/**
 * OfflineBanner — subtle banner when Supabase is unreachable.
 * Auto-checks connectivity and retries periodically.
 */
import { T } from "@/lib/theme";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const check = async () => {
      try {
        // Simple connectivity check — hit a fast, reliable endpoint
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://www.google.com/generate_204", {
          method: "HEAD",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mounted) setIsOffline(!res.ok);
      } catch {
        if (mounted) setIsOffline(true);
      }
    };

    // Initial check after a short delay
    const timer = setTimeout(check, 3000);

    // Re-check every 30 seconds
    intervalId = setInterval(check, 30000);

    return () => {
      mounted = false;
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>
        Offline mode — leaderboard may not be current
      </Text>
    </View>
  );
}

const styles = {
  banner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: T.warningBg,
    borderRadius: T.rS,
    borderWidth: 1,
    borderColor: T.warning,
    padding: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontSize: 12,
    color: T.warning,
    fontWeight: "600" as const,
    flex: 1,
  },
};
