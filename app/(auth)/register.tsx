import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { Screen } from "../../src/components/Screen";
import { useAuthStore } from "../../src/state/auth";

export default function RegisterScreen(): JSX.Element {
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (username.trim().length < 3) return "Username must be at least 3 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      return "Username can only contain letters, numbers, and underscores.";
    if (!email.includes("@")) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    setLocalError(null);
    const v = validate();
    if (v) {
      setLocalError(v);
      return;
    }
    setSubmitting(true);
    try {
      await register(username.trim(), email.trim().toLowerCase(), password);
    } catch {
      // surfaced via store error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-10 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-ember-500">
              <Ionicons name="sparkles" size={28} color="#FBF8F3" />
            </View>
            <Text className="text-3xl font-bold text-clay-700 dark:text-cream-100">
              Create account
            </Text>
            <Text className="mt-2 text-center text-base text-clay-400 dark:text-clay-200">
              Your encryption keys are generated on this device.
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Username"
              placeholder="ada_lovelace"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              leftIcon={<Ionicons name="at-outline" size={18} color="#A89886" />}
            />

            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Ionicons name="mail-outline" size={18} color="#A89886" />}
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              hint="Use a long, hard-to-guess phrase you can remember."
              leftIcon={<Ionicons name="key-outline" size={18} color="#A89886" />}
              rightSlot={
                <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#A89886"
                  />
                </Pressable>
              }
            />

            {(localError ?? error) ? (
              <View className="flex-row items-start gap-2 rounded-2xl bg-red-50 p-3 dark:bg-red-900/30">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="flex-1 text-sm text-red-600 dark:text-red-300">
                  {localError ?? error}
                </Text>
              </View>
            ) : null}

            <Button
              label="Create account"
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              size="lg"
            />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-clay-400 dark:text-clay-200">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={6}>
                <Text className="text-sm font-semibold text-ember-600 dark:text-ember-400">
                  Sign in
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
