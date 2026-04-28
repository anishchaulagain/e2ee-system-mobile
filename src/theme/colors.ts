// Resolved color tokens for use outside Tailwind (StatusBar, Splash, native pickers).
// Keep in sync with `tailwind.config.js`.

export const palette = {
  cream: {
    50: "#FBF8F3",
    100: "#F7F3EE",
    200: "#EFE8DD",
    300: "#E5DBC8",
  },
  clay: {
    100: "#E8E1D8",
    200: "#D1C4B3",
    300: "#A89886",
    400: "#7D6E5C",
    500: "#5A4E3F",
    600: "#3F3528",
    700: "#2A2218",
    800: "#1C1610",
    900: "#0F0B07",
  },
  ember: {
    300: "#EFA776",
    400: "#E68149",
    500: "#D97757",
    600: "#C25A36",
  },
} as const;

export const themeColors = {
  light: {
    background: palette.cream[100],
    surface: palette.cream[50],
    surfaceMuted: palette.cream[200],
    border: palette.cream[300],
    textPrimary: palette.clay[700],
    textSecondary: palette.clay[400],
    accent: palette.ember[500],
  },
  dark: {
    background: palette.clay[800],
    surface: palette.clay[700],
    surfaceMuted: palette.clay[600],
    border: palette.clay[500],
    textPrimary: palette.cream[100],
    textSecondary: palette.clay[200],
    accent: palette.ember[400],
  },
} as const;
