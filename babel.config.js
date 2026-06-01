module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its Babel transform into react-native-worklets.
    // The worklets plugin must be listed last. Skia pulls reanimated in via its
    // optional moduleWrapper; the plugin keeps that path working.
    plugins: ['react-native-worklets/plugin'],
  };
};
