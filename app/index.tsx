import { ActivityIndicator, View } from "react-native";

/**
 * Splash placeholder shown while the auth gate decides where to send the user.
 * The redirect happens in the root layout's `AuthGate`.
 */
export default function Index(): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center bg-cream-100 dark:bg-clay-800">
      <ActivityIndicator color="#D97757" size="large" />
    </View>
  );
}
