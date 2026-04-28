import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-cream-200 dark:bg-clay-700">
        <Ionicons name={icon} size={36} color="#D97757" />
      </View>
      <Text className="text-center text-xl font-semibold text-clay-700 dark:text-cream-100">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 text-center text-sm text-clay-400 dark:text-clay-200">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-6 w-full">{action}</View> : null}
    </View>
  );
}
