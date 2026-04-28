import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Avatar } from "../../src/components/Avatar";
import { Screen } from "../../src/components/Screen";
import { useAuthStore } from "../../src/state/auth";
import { useThemeStore } from "../../src/state/theme";

type ThemeMode = "light" | "dark" | "system";

const MODE_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const MODE_ICONS: Record<ThemeMode, keyof typeof Ionicons.glyphMap> = {
  light: "sunny-outline",
  dark: "moon-outline",
  system: "phone-portrait-outline",
};

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [signingOut, setSigningOut] = useState(false);

  const confirmLogout = (): void => {
    Alert.alert("Sign out", "You'll need to log in again to access your messages.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await logout();
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color="#5A4E3F" />
        </Pressable>
        <Text className="text-xl font-semibold text-clay-700 dark:text-cream-100">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {/* Profile card */}
        <View className="items-center rounded-3xl bg-cream-50 p-6 dark:bg-clay-700">
          <Avatar name={user?.username ?? "?"} size={72} />
          <Text className="mt-3 text-xl font-bold text-clay-700 dark:text-cream-100">
            {user?.username ?? "—"}
          </Text>
          <Text className="mt-0.5 text-sm text-clay-400 dark:text-clay-200">
            {user?.email ?? ""}
          </Text>

          <View className="mt-4 flex-row items-center gap-1.5 rounded-full bg-moss-400/15 px-3 py-1.5">
            <Ionicons name="shield-checkmark" size={14} color="#5C7B53" />
            <Text className="text-xs font-semibold text-moss-600">
              {user?.public_key ? "Encryption active" : "Setting up…"}
            </Text>
          </View>
        </View>

        {/* Appearance */}
        <Text className="mb-2 mt-8 px-2 text-xs font-semibold uppercase tracking-wide text-clay-400 dark:text-clay-200">
          Appearance
        </Text>
        <View className="overflow-hidden rounded-3xl bg-cream-50 dark:bg-clay-700">
          {(["system", "light", "dark"] as ThemeMode[]).map((m, i) => {
            const selected = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                className={`flex-row items-center gap-3 px-5 py-4 ${
                  i > 0 ? "border-t border-cream-200 dark:border-clay-600" : ""
                }`}
              >
                <Ionicons name={MODE_ICONS[m]} size={20} color="#7D6E5C" />
                <Text className="flex-1 text-base text-clay-700 dark:text-cream-100">
                  {MODE_LABELS[m]}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color="#D97757" />
                ) : (
                  <View className="h-5 w-5 rounded-full border border-clay-300 dark:border-clay-500" />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* About */}
        <Text className="mb-2 mt-8 px-2 text-xs font-semibold uppercase tracking-wide text-clay-400 dark:text-clay-200">
          About
        </Text>
        <View className="overflow-hidden rounded-3xl bg-cream-50 dark:bg-clay-700">
          <View className="flex-row items-start gap-3 p-5">
            <Ionicons name="lock-closed-outline" size={20} color="#7D6E5C" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-clay-700 dark:text-cream-100">
                End-to-end encryption
              </Text>
              <Text className="mt-1 text-xs text-clay-400 dark:text-clay-200">
                Messages are encrypted on this device with NaCl box (Curve25519 +
                XSalsa20-Poly1305). Your private key is stored in the device keychain and never
                leaves it.
              </Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={confirmLogout}
          disabled={signingOut}
          style={({ pressed }) => [{ opacity: signingOut ? 0.6 : pressed ? 0.85 : 1 }]}
          className="mt-8 flex-row items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-4 dark:border-red-900/40 dark:bg-red-900/20"
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text className="text-base font-semibold text-red-600 dark:text-red-300">
            {signingOut ? "Signing out…" : "Sign out"}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
