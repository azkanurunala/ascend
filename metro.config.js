// Expo Metro config — extend defaults to make sure audio assets (.wav) bundle.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
for (const ext of ['wav', 'mp3', 'm4a']) {
  if (!config.resolver.assetExts.includes(ext)) config.resolver.assetExts.push(ext);
}
module.exports = config;
