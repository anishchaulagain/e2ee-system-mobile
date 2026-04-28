import { View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

interface ScreenProps {
  children: React.ReactNode;
  edges?: readonly Edge[];
  /** Tailwind classes appended to the inner content view. */
  className?: string;
}

export function Screen({
  children,
  edges = ["top", "bottom"],
  className,
}: ScreenProps): JSX.Element {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-cream-100 dark:bg-clay-800">
      <View className={`flex-1 ${className ?? ""}`}>{children}</View>
    </SafeAreaView>
  );
}
