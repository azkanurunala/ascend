// ============ MONETIZATION CONFIG ============
// Central place for the RevenueCat key/entitlement and Game Center leaderboard
// IDs. No ads — there are no ad SDKs in this app.
//
// See MONETIZATION_SETUP.md for the step-by-step account checklist.

// --- RevenueCat (in-app purchases) -----------------------------------------
// Public SDK key (safe to embed — designed to ship in the client). This is the
// Apple App Store "Public app-specific API key" (`appl_…`) from the Ascend
// project in RevenueCat → API Keys. It transacts against the real App Store, so
// products must exist in App Store Connect and be synced into RevenueCat.
export const REVENUECAT_IOS_KEY = 'appl_tBJKIngPLFoOjYtgwDOcHGpATuD';
export const REVENUECAT_ANDROID_KEY = 'REPLACE_ME_revenuecat_google_key';

// The entitlement that unlocks premium content. MUST match the entitlement
// identifier in RevenueCat EXACTLY (including the space and capitalization).
export const ENTITLEMENT_ID = 'Ascend Pro';

// Optional: the Offering identifier to show in the paywall. Leave null to use
// the "current" offering you set as default in the RevenueCat dashboard.
export const OFFERING_ID = null;

// The lifetime product ID. Used as a direct fallback when the RevenueCat
// offering isn't configured yet (or during StoreKit-config simulator testing).
// Must match the product ID in App Store Connect / Ascend.storekit.
export const PRO_PRODUCT_ID = 'lifetime';

// Display-only fallback price for the paywall when the store can't return a
// live price (e.g. Simulator without a StoreKit config). The real localized
// price from the store always takes precedence when available.
export const PRO_FALLBACK_PRICE = '$2.99';

// No ads. Reviving beyond the free daily one requires the Ascend Pro purchase.

// --- Apple Game Center (global leaderboard) --------------------------------
// One leaderboard per difficulty. Create all three in App Store Connect → your
// app → Game Center → Leaderboards, using these exact Leaderboard IDs.
export const GAME_CENTER_LEADERBOARDS = {
  chill: 'ascend.altitude.chill',
  normal: 'ascend.altitude.normal',
  intense: 'ascend.altitude.intense',
};

// Resolve a difficulty to its leaderboard ID (falls back to normal).
export const leaderboardIdFor = (difficulty) =>
  GAME_CENTER_LEADERBOARDS[difficulty] || GAME_CENTER_LEADERBOARDS.normal;

// True only once you've filled in a real RevenueCat key. Gates IAP init so we
// don't spam errors with the placeholder key.
export const IAP_CONFIGURED = !REVENUECAT_IOS_KEY.startsWith('REPLACE_ME');

// Whether a key still looks like a placeholder.
export const isPlaceholder = (v) => typeof v !== 'string' || v.startsWith('REPLACE_ME');
