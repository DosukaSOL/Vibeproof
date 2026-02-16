// app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="profile" screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="missions" options={{ title: "Missions" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
    </Tabs>
  );
}
