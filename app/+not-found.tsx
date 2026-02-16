import { Link, Stack } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: true }} />
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backgroundColor: "#0D1117",
        }}
      >
        <Text
          style={{ fontSize: 18, fontWeight: "700", color: "#E6EDF3", marginBottom: 12 }}
        >
          This screen doesn't exist.
        </Text>
        <Link
          href="/(tabs)/profile"
          style={{ fontSize: 16, color: "#58A6FF" }}
        >
          Go to home screen
        </Link>
      </View>
    </>
  );
}
