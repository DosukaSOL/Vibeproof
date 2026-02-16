// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";

const CenteredLogo = () => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Image
      source={require('@/assets/vpicon.png')}
      style={{ width: 52, height: 52, resizeMode: 'contain', borderRadius: 10 }}
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
        headerTitleAlign: 'center',
        headerLeft: () => null,
        headerRight: () => null,
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#00FF00',
        tabBarActiveTintColor: '#00FF00',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
        },
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
