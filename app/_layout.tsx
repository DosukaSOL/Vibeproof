// app/_layout.tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WalletProvider } from "@/context/WalletContext";
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <Stack screenOptions={{ headerShown: false, animation: "none" }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </WalletProvider>
    </ErrorBoundary>
  );
}
