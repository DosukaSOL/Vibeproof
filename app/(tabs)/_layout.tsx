// app/(tabs)/_layout.tsx
import { T } from "@/lib/theme";
import { Tabs } from "expo-router";
import { Image, Platform, Text, View } from "react-native";

const CenteredLogo = () => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <Image
      source={require("@/assets/vpicon.png")}
      resizeMode="contain"
      style={{ width: 48, height: 48, borderRadius: 10 }}
    />
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="profile"
      screenOptions={{
        headerShown: true,
        headerTitle: () => <CenteredLogo />,
        headerTitleAlign: "center",
        headerLeft: () => null,
        headerRight: () => null,
        headerStyle: {
          backgroundColor: T.bg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: T.borderLight,
        },
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.textMuted,
        tabBarStyle: {
          backgroundColor: T.bg,
          borderTopColor: T.borderLight,
          borderTopWidth: 1,
          height: Platform.OS === "android" ? 60 : 84,
          paddingBottom: Platform.OS === "android" ? 8 : 28,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        animation: "none",
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="missions"
        options={{
          title: "Missions",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🎯</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏆</Text>
          ),
        }}
      />
    </Tabs>
  );
}
