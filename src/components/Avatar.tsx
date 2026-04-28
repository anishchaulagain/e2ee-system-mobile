import { Text, View } from "react-native";
import { colorIndexFor, initialsFor } from "../utils/conversation";

const TINTS = [
  { bg: "bg-ember-100", fg: "text-ember-700" },
  { bg: "bg-moss-400/20", fg: "text-moss-600" },
  { bg: "bg-clay-200", fg: "text-clay-700" },
  { bg: "bg-ember-200", fg: "text-ember-800" },
  { bg: "bg-cream-300", fg: "text-clay-700" },
  { bg: "bg-moss-500/25", fg: "text-moss-600" },
] as const;

interface AvatarProps {
  name: string;
  size?: number;
  online?: boolean;
}

const SIZE_TEXT_CLASS: Record<number, string> = {
  32: "text-xs",
  40: "text-sm",
  48: "text-base",
  56: "text-lg",
  64: "text-xl",
};

export function Avatar({ name, size = 48, online }: AvatarProps): JSX.Element {
  const tint = TINTS[colorIndexFor(name, TINTS.length)] ?? TINTS[0]!;
  const textClass = SIZE_TEXT_CLASS[size] ?? "text-base";

  return (
    <View className="relative" style={{ width: size, height: size }}>
      <View
        className={`${tint.bg} items-center justify-center rounded-full`}
        style={{ width: size, height: size }}
      >
        <Text className={`${tint.fg} font-semibold ${textClass}`}>{initialsFor(name)}</Text>
      </View>
      {online ? (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2 border-cream-100 bg-moss-400 dark:border-clay-800"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      ) : null}
    </View>
  );
}
