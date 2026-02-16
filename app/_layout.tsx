// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack 
      screenOptions={{ headerShown: false }}
      initialRouteName="(tabs)"
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="modal" 
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
