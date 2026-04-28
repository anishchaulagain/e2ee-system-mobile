import "../global.css";

import { useEffect } from "react";
import { Appearance } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { setUnauthorizedHandler } from "../src/api/client";
import { useAuthStore } from "../src/state/auth";
import { useThemeStore } from "../src/state/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate(): null {
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const inAuthGroup = segments[0] === "(auth)";

    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [status, segments, router]);

  return null;
}

export default function RootLayout(): JSX.Element {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const forceLogout = useAuthStore((s) => s.forceLogout);
  const applySystem = useThemeStore((s) => s.applySystem);
  const resolved = useThemeStore((s) => s.resolved);

  useEffect(() => {
    void bootstrap();
    setUnauthorizedHandler(() => {
      void forceLogout();
    });
    return () => setUnauthorizedHandler(null);
  }, [bootstrap, forceLogout]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => applySystem(colorScheme));
    return () => sub.remove();
  }, [applySystem]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={resolved === "dark" ? "light" : "dark"} />
          <AuthGate />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: resolved === "dark" ? "#1C1610" : "#F7F3EE",
              },
              animation: "fade",
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
