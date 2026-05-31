module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin must be listed last. Skia pulls reanimated
    // in via its optional moduleWrapper; the plugin keeps that path working.
    plugins: ['react-native-reanimated/plugin'],
  };
};
