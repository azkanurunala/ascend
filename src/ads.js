// ============ ADS — AdMob rewarded "watch ad to revive" ============
// Thin wrapper over react-native-google-mobile-ads. Exposes:
//   initAds()           — call once on app start (initializes SDK + ATT prompt)
//   preloadRevive()     — start loading the next rewarded ad in the background
//   showReviveAd()      — Promise<boolean>: true only if the user EARNED the reward
//
// Everything is wrapped so a missing/unlinked native module (e.g. running the
// JS bundle without a dev build) never crashes the game — it just resolves
// false and the caller declines the revive.

import { Platform } from 'react-native';
import {
  USE_TEST_ADS,
  ADMOB_IOS_REWARDED_UNIT,
  ADMOB_ANDROID_REWARDED_UNIT,
  isPlaceholder,
} from './config';

// Lazy-require so the module is only touched on a real device build.
function admob() {
  try {
    return require('react-native-google-mobile-ads');
  } catch (e) {
    return null;
  }
}

function unitId() {
  const M = admob();
  if (!M) return null;
  const real = Platform.OS === 'ios' ? ADMOB_IOS_REWARDED_UNIT : ADMOB_ANDROID_REWARDED_UNIT;
  if (USE_TEST_ADS || isPlaceholder(real)) return M.TestIds.REWARDED;
  return real;
}

let initialized = false;
let rewarded = null; // current preloaded RewardedAd instance
let loaded = false;

export async function initAds() {
  const M = admob();
  if (!M || initialized) return;
  initialized = true;
  try {
    // Ask for tracking permission first (iOS 14.5+) so AdMob can serve
    // personalized ads where allowed; non-personalized otherwise.
    if (Platform.OS === 'ios') {
      try {
        const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
        await requestTrackingPermissionsAsync();
      } catch (e) {
        /* tracking-transparency not present — fine, serve non-personalized */
      }
    }
    await M.default().initialize();
    preloadRevive();
  } catch (e) {
    /* SDK init failed — revive ads will simply be unavailable */
  }
}

// Build + load a fresh rewarded ad. Safe to call repeatedly.
export function preloadRevive() {
  const M = admob();
  const id = unitId();
  if (!M || !id) return;
  try {
    loaded = false;
    rewarded = M.RewardedAd.createForAdRequest(id, {
      requestNonPersonalizedAdsOnly: true,
    });
    rewarded.addAdEventListener(M.RewardedAdEventType.LOADED, () => {
      loaded = true;
    });
    rewarded.load();
  } catch (e) {
    rewarded = null;
    loaded = false;
  }
}

// Show the rewarded ad. Resolves true only if the user watched enough to earn
// the reward. Always preloads the next ad afterwards.
export function showReviveAd() {
  return new Promise((resolve) => {
    const M = admob();
    if (!M || !rewarded || !loaded) {
      // Not ready — kick off a load for next time and decline this revive.
      preloadRevive();
      resolve(false);
      return;
    }

    let earned = false;
    const ad = rewarded;
    const subs = [];
    const cleanup = () => {
      subs.forEach((u) => {
        try {
          u();
        } catch (e) {}
      });
      // Always have the next ad ready.
      preloadRevive();
    };

    subs.push(
      ad.addAdEventListener(M.RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      })
    );
    subs.push(
      ad.addAdEventListener(M.AdEventType.CLOSED, () => {
        cleanup();
        resolve(earned);
      })
    );
    subs.push(
      ad.addAdEventListener(M.AdEventType.ERROR, () => {
        cleanup();
        resolve(false);
      })
    );

    try {
      ad.show();
    } catch (e) {
      cleanup();
      resolve(false);
    }
  });
}
