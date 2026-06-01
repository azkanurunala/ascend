// Local Expo module: thin native bridge to Apple Game Center (GameKit).
// JS code should import the safe wrapper in `src/leaderboard.js` instead of
// this directly — that one degrades gracefully when the native module is
// absent (e.g. running the JS bundle before a dev build is compiled).
import { requireOptionalNativeModule, requireNativeModule } from 'expo-modules-core';

const ExpoGameCenter = requireOptionalNativeModule
  ? requireOptionalNativeModule('ExpoGameCenter')
  : (() => {
      try {
        return requireNativeModule('ExpoGameCenter');
      } catch (e) {
        return null;
      }
    })();

export default ExpoGameCenter;
