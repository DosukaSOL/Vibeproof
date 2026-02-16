// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import React from "react";
import { Image, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="profile" screenOptions={{ 
      headerShown: true,
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('@/assets/noble.png')}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
        </View>
      ),
    }}>
      <Tabs.Screen name="missions" options={{ title: "Missions", headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('@/assets/noble.png')}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
        </View>
      ) }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('@/assets/noble.png')}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
        </View>
      ) }} />
      <Tabs.Screen name="leaderboard" options={{ title: "Leaderboard", headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('@/assets/noble.png')}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
        </View>
      ) }} />
    </Tabs>
  );
}
