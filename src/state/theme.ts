import { create } from "zustand";
import { Appearance, type ColorSchemeName } from "react-native";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  applySystem: (system: ColorSchemeName) => void;
}

function resolve(mode: ThemeMode, system: ColorSchemeName): "light" | "dark" {
  if (mode === "system") return system === "dark" ? "dark" : "light";
  return mode;
}

const initialSystem = Appearance.getColorScheme();

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "system",
  resolved: resolve("system", initialSystem),
  setMode: (mode) => set({ mode, resolved: resolve(mode, Appearance.getColorScheme()) }),
  applySystem: (system) => {
    if (get().mode === "system") {
      set({ resolved: resolve("system", system) });
    }
  },
}));
