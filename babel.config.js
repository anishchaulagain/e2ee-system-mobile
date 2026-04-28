module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Reanimated 4 (Expo SDK 54+) ships its worklets via `react-native-worklets`.
    // The plugin must be listed last.
    plugins: ["react-native-worklets/plugin"],
  };
};
