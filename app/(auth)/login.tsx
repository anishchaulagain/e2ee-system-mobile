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

export default function LoginScreen(): JSX.Element {
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (): Promise<void> => {
    setLocalError(null);
    if (!identifier.trim() || !password) {
      setLocalError("Please enter your username/email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch {
      // store sets `error`; rendered below
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
              <Ionicons name="lock-closed" size={28} color="#FBF8F3" />
            </View>
            <Text className="text-3xl font-bold text-clay-700 dark:text-cream-100">
              Welcome back
            </Text>
            <Text className="mt-2 text-center text-base text-clay-400 dark:text-clay-200">
              Sign in to continue your private conversations.
            </Text>
          </View>

          <View className="gap-4">
            <Input
              label="Username or email"
              placeholder="alice or alice@e2ee.chat"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              keyboardType="email-address"
              value={identifier}
              onChangeText={setIdentifier}
              leftIcon={<Ionicons name="person-outline" size={18} color="#A89886" />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
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
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
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
              label="Sign in"
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
              size="lg"
            />
          </View>

          <View className="mt-8 flex-row items-center justify-center gap-1">
            <Text className="text-sm text-clay-400 dark:text-clay-200">New to Cipher?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable hitSlop={6}>
                <Text className="text-sm font-semibold text-ember-600 dark:text-ember-400">
                  Create an account
                </Text>
              </Pressable>
            </Link>
          </View>

          <View className="mt-12 items-center">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={14} color="#7D6E5C" />
              <Text className="text-xs text-clay-400 dark:text-clay-200">
                End-to-end encrypted. Even we can't read your messages.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
