/**
 * Sound Effects System
 * Plays audio cues for app events — toggleable via settings.
 * Uses expo-av, lazy-loaded. Falls back silently if unavailable.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_SOUNDS_ENABLED = "vp_sounds_enabled";

let _soundsEnabled: boolean | null = null;

/** Check if sounds are enabled (default: true) */
export async function areSoundsEnabled(): Promise<boolean> {
  if (_soundsEnabled !== null) return _soundsEnabled;
  try {
    const val = await AsyncStorage.getItem(KEY_SOUNDS_ENABLED);
    _soundsEnabled = val !== "false"; // default true
    return _soundsEnabled;
  } catch {
    return true;
  }
}

/** Toggle sounds on/off */
export async function setSoundsEnabled(enabled: boolean): Promise<void> {
  _soundsEnabled = enabled;
  await AsyncStorage.setItem(KEY_SOUNDS_ENABLED, enabled ? "true" : "false");
}

export type SoundType =
  | "mission_complete"
  | "xp_gain"
  | "badge_unlock"
  | "level_up"
  | "button_tap";

/**
 * Play a sound effect. Safe to call anywhere — no-ops gracefully.
 */
export async function playSound(type: SoundType): Promise<void> {
  try {
    const enabled = await areSoundsEnabled();
    if (!enabled) return;

    const { Audio } = require("expo-av");

    // All sounds use the chime with different configs
    const configs: Record<SoundType, { volume: number; rate: number }> = {
      mission_complete: { volume: 0.7, rate: 1.0 },
      xp_gain: { volume: 0.4, rate: 1.3 },
      badge_unlock: { volume: 0.8, rate: 0.8 },
      level_up: { volume: 0.9, rate: 0.7 },
      button_tap: { volume: 0.2, rate: 1.5 },
    };

    const cfg = configs[type] || configs.xp_gain;

    const { sound } = await Audio.Sound.createAsync(
      require("@/assets/sounds/chime.wav"),
      { shouldPlay: true, volume: cfg.volume, rate: cfg.rate }
    );

    // Auto-unload after playback
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    // expo-av not available or sound file missing — silently ignore
  }
}
