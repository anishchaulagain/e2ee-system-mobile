import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { formatTimeOnly } from "../utils/time";

interface MessageBubbleProps {
  text: string;
  decrypted: boolean;
  fromMe: boolean;
  timestamp: string;
  showTail?: boolean;
}

export function MessageBubble({
  text,
  decrypted,
  fromMe,
  timestamp,
  showTail = true,
}: MessageBubbleProps): JSX.Element {
  if (!decrypted) {
    return (
      <View className={`my-0.5 max-w-[78%] flex-row ${fromMe ? "self-end" : "self-start"}`}>
        <View className="flex-row items-center gap-1.5 rounded-2xl bg-clay-200/40 px-3 py-2 dark:bg-clay-600/60">
          <Ionicons name="lock-closed" size={12} color="#A89886" />
          <Text className="text-xs italic text-clay-400 dark:text-clay-200">
            Could not decrypt this message
          </Text>
        </View>
      </View>
    );
  }

  const bubbleClass = fromMe
    ? "bg-ember-500"
    : "bg-cream-50 border border-cream-300 dark:bg-clay-600 dark:border-clay-500";

  const textClass = fromMe ? "text-cream-50" : "text-clay-700 dark:text-cream-100";

  const metaClass = fromMe ? "text-cream-200/80" : "text-clay-400 dark:text-clay-200";

  const radius = showTail
    ? fromMe
      ? "rounded-3xl rounded-br-md"
      : "rounded-3xl rounded-bl-md"
    : "rounded-3xl";

  return (
    <View className={`my-0.5 max-w-[80%] ${fromMe ? "self-end" : "self-start"}`}>
      <View className={`${bubbleClass} ${radius} px-4 py-2.5`}>
        <Text className={`${textClass} text-base leading-5`}>{text}</Text>
        <Text className={`${metaClass} mt-1 self-end text-[10px]`}>{formatTimeOnly(timestamp)}</Text>
      </View>
    </View>
  );
}
