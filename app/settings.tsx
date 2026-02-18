/**
 * Settings Screen
 * App preferences, data management, version info
 */
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { FadeInView } from "@/components/FadeInView";
import { useWallet } from "@/hooks/useWallet";
import {
    AppSettings,
    clearAllData,
    getSettings,
    saveSettings,
} from "@/lib/localStore";
import { T } from "@/lib/theme";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { address, disconnect } = useWallet();
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    soundsEnabled: true,
    hapticsEnabled: true,
  });

  const appVersion =
    Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || "3.0.0";

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
    })();
  }, []);

  const updateSetting = useCallback(
    async (key: keyof AppSettings, value: boolean) => {
      const updated = { ...settings, [key]: value };
      setSettings(updated);
      await saveSettings(updated);
    },
    [settings]
  );

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will erase all local data including missions, XP, achievements, and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            if (address) {
              await clearAllData(address);
            }
            Alert.alert("Done", "All local data has been cleared.");
          },
        },
      ]
    );
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Wallet",
      "You will need to reconnect your wallet to use the app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await disconnect();
              router.replace("/(tabs)/profile");
            } catch {}
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FadeInView index={0}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>
      </FadeInView>

      {/* Preferences */}
      <FadeInView index={1}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>🔔 Notifications</Text>
              <Text style={styles.settingDesc}>Daily mission reminders</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(v) => updateSetting("notificationsEnabled", v)}
              trackColor={{ false: T.surface2, true: T.accent }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>🔊 Sound Effects</Text>
              <Text style={styles.settingDesc}>Mission sounds and chimes</Text>
            </View>
            <Switch
              value={settings.soundsEnabled}
              onValueChange={(v) => updateSetting("soundsEnabled", v)}
              trackColor={{ false: T.surface2, true: T.accent }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>📳 Haptics</Text>
              <Text style={styles.settingDesc}>Vibration feedback</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(v) => updateSetting("hapticsEnabled", v)}
              trackColor={{ false: T.surface2, true: T.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </FadeInView>

      {/* Account */}
      <FadeInView index={2}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          {address && (
            <AnimatedPressable onPress={handleDisconnect} style={styles.dangerBtn}>
              <Text style={styles.dangerBtnText}>Disconnect Wallet</Text>
            </AnimatedPressable>
          )}

          <AnimatedPressable onPress={handleClearData} style={styles.dangerBtn}>
            <Text style={styles.dangerBtnText}>Clear All Data</Text>
          </AnimatedPressable>
        </View>
      </FadeInView>

      {/* About */}
      <FadeInView index={3}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            VibeProof — Proof-of-Action Gaming on Solana
          </Text>
          <Text style={styles.versionText}>Version {appVersion}</Text>
          <Text style={styles.versionText}>Built with Expo SDK 54</Text>
        </View>
      </FadeInView>
    </ScrollView>
  );
}

const styles = {
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.bg,
    minHeight: "100%" as any,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 15,
    color: T.accent,
    fontWeight: "600" as const,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: T.text,
  },
  section: {
    backgroundColor: T.surface,
    borderRadius: T.r,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: T.text,
  },
  settingRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 6,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: T.text,
  },
  settingDesc: {
    fontSize: 12,
    color: T.textMuted,
  },
  dangerBtn: {
    backgroundColor: T.errorBg,
    borderRadius: T.rS,
    paddingVertical: 12,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: T.error,
  },
  dangerBtnText: {
    color: T.error,
    fontWeight: "700" as const,
    fontSize: 14,
  },
  aboutText: {
    fontSize: 13,
    color: T.textSec,
    lineHeight: 18,
  },
  versionText: {
    fontSize: 12,
    color: T.textMuted,
  },
};
