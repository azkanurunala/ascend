// ============ MONETIZATION CONFIG ============
// Central place for all the keys/IDs you create in the AdMob and RevenueCat
// dashboards + App Store Connect. Replace every `REPLACE_ME` before a release
// build. Until then the app falls back to Google's official TEST ad units and
// IAP simply fails gracefully (no crash), so dev builds keep working.
//
// See MONETIZATION_SETUP.md for the step-by-step account checklist.

// --- RevenueCat (in-app purchases) -----------------------------------------
// Public SDK key (safe to embed). Project → API keys → "Public app-specific
// API Key". For the real App Store this MUST be the Apple key `appl_…`.
//
// ⚠️ The value below is a RevenueCat *Test Store / sandbox* key (`test_…`). It
// lets you exercise the paywall + entitlement flow in development, but it does
// NOT transact against the real App Store. Before the production build, replace
// it with the `appl_…` key from your Apple app in RevenueCat → API Keys.
export const REVENUECAT_IOS_KEY = 'test_GVPpCkTVxwamqQtoXPeufvuDtof';
export const REVENUECAT_ANDROID_KEY = 'REPLACE_ME_revenuecat_google_key';

// The entitlement that unlocks premium content. MUST match the entitlement
// identifier in RevenueCat EXACTLY (including the space and capitalization).
export const ENTITLEMENT_ID = 'Ascend Pro';

// Optional: the Offering identifier to show in the paywall. Leave null to use
// the "current" offering you set as default in the RevenueCat dashboard.
export const OFFERING_ID = null;

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
