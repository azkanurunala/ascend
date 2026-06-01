// ============ MONETIZATION CONFIG ============
// Central place for all the keys/IDs you create in the AdMob and RevenueCat
// dashboards + App Store Connect. Replace every `REPLACE_ME` before a release
// build. Until then the app falls back to Google's official TEST ad units and
// IAP simply fails gracefully (no crash), so dev builds keep working.
//
// See MONETIZATION_SETUP.md for the step-by-step account checklist.

// --- RevenueCat (in-app purchases) -----------------------------------------
// Project → API keys → "Public app-specific API Key" for the Apple App Store.
// Looks like: appl_xxxxxxxxxxxxxxxxxxxxxxxxxx
export const REVENUECAT_IOS_KEY = 'REPLACE_ME_revenuecat_apple_key';
export const REVENUECAT_ANDROID_KEY = 'REPLACE_ME_revenuecat_google_key';

// --- Google AdMob (rewarded revive ad) -------------------------------------
// AdMob → Apps → your app → App ID (ca-app-pub-XXXX~YYYY) and the rewarded
// ad unit ID (ca-app-pub-XXXX/ZZZZ). The App ID ALSO goes in app.json.
export const ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511'; // test app id
export const ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713'; // test app id
export const ADMOB_IOS_REWARDED_UNIT = 'REPLACE_ME_ios_rewarded_unit';
export const ADMOB_ANDROID_REWARDED_UNIT = 'REPLACE_ME_android_rewarded_unit';

// Force Google's test ads regardless of the unit IDs above. Keep true while
// developing; set false for the production build (real ads, real revenue).
// Tapping a REAL ad you own during testing can get your AdMob account banned —
// always test with this true.
export const USE_TEST_ADS = true;

// --- Apple Game Center (global leaderboard) --------------------------------
// The leaderboard's "Leaderboard ID" exactly as you type it in App Store
// Connect → your app → Game Center → Leaderboards. This is an arbitrary string
// you choose; it does NOT have to match the bundle id. Keep it in sync there.
export const GAME_CENTER_LEADERBOARD_ID = 'ascend.altitude.alltime';

// True only once you've filled in a real RevenueCat key. Gates IAP init so we
// don't spam errors with the placeholder key.
export const IAP_CONFIGURED = !REVENUECAT_IOS_KEY.startsWith('REPLACE_ME');

// Whether a key still looks like a placeholder (used by ads.js too).
export const isPlaceholder = (v) => typeof v !== 'string' || v.startsWith('REPLACE_ME');
