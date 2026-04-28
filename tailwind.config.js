/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Claude-inspired palette: warm, earthy, calm
        cream: {
          50: "#FBF8F3",
          100: "#F7F3EE",
          200: "#EFE8DD",
          300: "#E5DBC8",
          400: "#D6C7AC",
          500: "#C2AE89",
        },
        clay: {
          50: "#F5F1EC",
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
          // Claude's signature warm orange/coral
          50: "#FDF4EE",
          100: "#FAE6D6",
          200: "#F5C9A6",
          300: "#EFA776",
          400: "#E68149",
          500: "#D97757",
          600: "#C25A36",
          700: "#A1442A",
          800: "#7E3622",
          900: "#5C271A",
        },
        moss: {
          400: "#7A9B6E",
          500: "#5C7B53",
          600: "#465E3F",
        },
      },
      fontFamily: {
        sans: ["System"],
        serif: ["Georgia", "serif"],
        mono: ["Menlo", "monospace"],
      },
      borderRadius: {
        "4xl": "28px",
        "5xl": "36px",
      },
    },
  },
  plugins: [],
};
