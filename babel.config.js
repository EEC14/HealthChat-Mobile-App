module.exports = function (api) {
  plugins: [
    ['react-native-reanimated/plugin'],
    // other plugins...
  ],
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
