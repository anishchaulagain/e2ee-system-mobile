import { Pressable, Text, View } from "react-native";
import { Avatar } from "./Avatar";
import { formatRelative } from "../utils/time";

interface ConversationItemProps {
  name: string;
  preview: string;
  timestamp?: string | null;
  unread?: boolean;
  online?: boolean;
  onPress: () => void;
}

export function ConversationItem({
  name,
  preview,
  timestamp,
  unread,
  online,
  onPress,
}: ConversationItemProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
      className="flex-row items-center gap-3 px-5 py-3.5"
    >
      <Avatar name={name} size={56} online={online} />

      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className="flex-1 text-base font-semibold text-clay-700 dark:text-cream-100"
            numberOfLines={1}
          >
            {name}
          </Text>
          {timestamp ? (
            <Text
              className={`ml-2 text-xs ${
                unread
                  ? "text-ember-600 dark:text-ember-400 font-semibold"
                  : "text-clay-400 dark:text-clay-200"
              }`}
            >
              {formatRelative(timestamp)}
            </Text>
          ) : null}
        </View>

        <View className="mt-0.5 flex-row items-center justify-between">
          <Text
            className={`flex-1 text-sm ${
              unread
                ? "text-clay-600 dark:text-cream-200 font-medium"
                : "text-clay-400 dark:text-clay-200"
            }`}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {unread ? <View className="ml-2 h-2.5 w-2.5 rounded-full bg-ember-500" /> : null}
        </View>
      </View>
    </Pressable>
  );
}
