import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Secure key/value storage.
 *
 * On iOS/Android we use the device keychain via `expo-secure-store` (hardware-backed
 * where available). On web we fall back to AsyncStorage — secure storage isn't
 * available in browsers; this app's primary target is native devices.
 */
const isNative = Platform.OS === "ios" || Platform.OS === "android";

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isNative) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const StorageKeys = {
  accessToken: "auth.access_token",
  refreshToken: "auth.refresh_token",
  userId: "auth.user_id",
  privateKey: "crypto.private_key",
  publicKey: "crypto.public_key",
} as const;
