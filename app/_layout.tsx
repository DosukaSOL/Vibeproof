// app/_layout.tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WalletProvider } from "@/context/WalletContext";
import { Stack } from "expo-router";

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
          <Stack.Screen
            name="user-profile"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="x-callback"
            options={{ headerShown: false, animation: "fade" }}
          />
          <Stack.Screen
            name="github-callback"
            options={{ headerShown: false, animation: "fade" }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </WalletProvider>
    </ErrorBoundary>
  );
}
