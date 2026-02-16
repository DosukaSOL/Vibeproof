// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";

const LogoHeader = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <Image
      source={require('@/assets/noble.png')}
      style={{ width: 44, height: 44, resizeMode: 'contain' }}
    />
    <Text style={{ fontSize: 22, fontWeight: '800', color: '#00FF00', letterSpacing: 0.5 }}>
      VibeProof
    </Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="profile"
      screenOptions={{
        headerShown: true,
        headerTitle: () => <LogoHeader />,
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
