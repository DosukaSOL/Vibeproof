/**
 * AvatarPicker Component
 * Tap to pick a profile photo from the device's photo library.
 * Uses expo-image-picker (lazy loaded).
 */
import { UserAvatar } from "@/components/UserAvatar";
import { T } from "@/lib/theme";
import { useCallback } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

interface AvatarPickerProps {
  uri?: string | null;
  name?: string;
  onPicked: (uri: string) => void;
}

export function AvatarPicker({ uri, name, onPicked }: AvatarPickerProps) {
  const handlePick = useCallback(async () => {
    try {
      const ImagePicker = require("expo-image-picker");

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access in your device settings to set a profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        onPicked(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn("[AvatarPicker] Error:", err?.message);
      Alert.alert("Error", "Could not open photo library. Please try again.");
    }
  }, [onPicked]);

  return (
    <TouchableOpacity onPress={handlePick} activeOpacity={0.7}>
      <View style={pickerStyles.container}>
        <UserAvatar uri={uri} name={name} size={80} />
        <View style={pickerStyles.editBadge}>
          <Text style={pickerStyles.editIcon}>📷</Text>
        </View>
      </View>
      <Text style={pickerStyles.hint}>Tap to change photo</Text>
    </TouchableOpacity>
  );
}

const pickerStyles = {
  container: {
    alignSelf: "center" as const,
    position: "relative" as const,
  },
  editBadge: {
    position: "absolute" as const,
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: T.bg,
  },
  editIcon: {
    fontSize: 14,
  },
  hint: {
    fontSize: 12,
    color: T.textMuted,
    textAlign: "center" as const,
    marginTop: 6,
  },
};
