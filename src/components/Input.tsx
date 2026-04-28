import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useThemeStore } from "../state/theme";
import { themeColors } from "../theme/colors";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string | null;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, leftIcon, rightSlot, ...rest },
  ref,
) {
  const resolved = useThemeStore((s) => s.resolved);
  const c = themeColors[resolved];

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-clay-600 dark:text-cream-200">{label}</Text>
      ) : null}

      <View
        className={`flex-row items-center rounded-2xl border bg-cream-50 px-4 dark:bg-clay-700 ${
          error
            ? "border-red-400"
            : "border-cream-300 dark:border-clay-500"
        }`}
        style={{ minHeight: 52 }}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={c.textSecondary}
          selectionColor={c.accent}
          className="flex-1 text-base text-clay-700 dark:text-cream-100"
          style={{ paddingVertical: 12 }}
          {...rest}
        />
        {rightSlot ? <View className="ml-2">{rightSlot}</View> : null}
      </View>

      {error ? (
        <Text className="text-xs text-red-500">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-clay-400 dark:text-clay-200">{hint}</Text>
      ) : null}
    </View>
  );
});
