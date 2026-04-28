import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, { bg: string; text: string; pressed: string }> = {
  primary: {
    bg: "bg-ember-500",
    text: "text-cream-50",
    pressed: "opacity-90",
  },
  secondary: {
    bg: "bg-cream-200 dark:bg-clay-600",
    text: "text-clay-700 dark:text-cream-100",
    pressed: "opacity-80",
  },
  ghost: {
    bg: "bg-transparent",
    text: "text-clay-600 dark:text-cream-200",
    pressed: "opacity-70",
  },
  danger: {
    bg: "bg-red-500",
    text: "text-white",
    pressed: "opacity-90",
  },
};

const SIZE_CLASSES: Record<Size, { padding: string; text: string; height: number }> = {
  sm: { padding: "px-4", text: "text-sm", height: 36 },
  md: { padding: "px-5", text: "text-base", height: 48 },
  lg: { padding: "px-6", text: "text-base", height: 56 },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  leftIcon,
  rightIcon,
  fullWidth,
  ...rest
}: ButtonProps): JSX.Element {
  const v = VARIANT_CLASSES[variant];
  const s = SIZE_CLASSES[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={({ pressed }) => [
        { height: s.height, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
      className={`${v.bg} ${s.padding} ${
        fullWidth ? "w-full" : ""
      } flex-row items-center justify-center rounded-2xl`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#5A4E3F"} />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {leftIcon}
          <Text className={`${v.text} ${s.text} font-semibold`}>{label}</Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}
