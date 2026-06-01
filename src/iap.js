// ============ IAP — RevenueCat ("Ascend Pro" lifetime unlock) ============
// Modern RevenueCat integration. The premium tier is a single non-consumable
// "Lifetime" product that grants the `Ascend Pro` entitlement, which unlocks
// every orb skin (and skips the revive ad). Uses RevenueCat's hosted Paywall
// (react-native-purchases-ui) and Customer Center — you design both in the
// RevenueCat dashboard, so the app never hardcodes prices or product lists.
//
// Public API:
//   initIAP(onProChange)     — configure once; pushes Pro status on every change
//   getProStatus()           — Promise<boolean> current entitlement state
//   presentPaywall()         — show the paywall; Promise<{ purchased }>
//   presentPaywallIfNeeded() — show only if the user lacks Ascend Pro
//   presentCustomerCenter()  — Apple-style manage/restore/refund UI
//   restorePurchases()       — Promise<boolean> Pro state after restore
//   getOfferingPrice()       — Promise<string|null> localized lifetime price
//
// Everything degrades to a safe no-op when the native modules are absent (e.g.
// JS-only bundle, or a build made before the SDK was compiled in).

import { Platform } from 'react-native';
import {
  REVENUECAT_IOS_KEY,
  REVENUECAT_ANDROID_KEY,
  ENTITLEMENT_ID,
  OFFERING_ID,
  isPlaceholder,
} from './config';

// Lazy, crash-proof access to the native packages.
function purchasesModule() {
  try {
    return require('react-native-purchases');
  } catch (e) {
    return null;
  }
}
function ui() {
  try {
    return require('react-native-purchases-ui');
  } catch (e) {
    return null;
  }
}
const Purchases = () => purchasesModule()?.default || null;
const RevenueCatUI = () => ui()?.default || null;

let configured = false;

// True when a real customer info object reports the Ascend Pro entitlement.
export function hasPro(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

// Configure RevenueCat once and subscribe to entitlement changes. `onProChange`
// is called immediately-ish (via the SDK listener) whenever Pro flips.
export function initIAP(onProChange) {
  const P = Purchases();
  if (!P || configured) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  if (isPlaceholder(key)) return; // no real key yet — stay in mock/no-op mode
  try {
    const mod = purchasesModule();
    if (__DEV__ && mod?.LOG_LEVEL) {
      P.setLogLevel(mod.LOG_LEVEL.DEBUG);
    }
    P.configure({ apiKey: key });
    configured = true;
    if (typeof onProChange === 'function') {
      // Source of truth: react to every customer-info update.
      P.addCustomerInfoUpdateListener((info) => onProChange(hasPro(info)));
    }
  } catch (e) {
    /* leave unconfigured — callers no-op */
  }
}

// Current entitlement state, fetched fresh from RevenueCat.
export async function getProStatus() {
  const P = Purchases();
  if (!P || !configured) return false;
  try {
    return hasPro(await P.getCustomerInfo());
  } catch (e) {
    return false;
  }
}

function purchasedFrom(result) {
  const consts = ui();
  const R = consts?.PAYWALL_RESULT || {};
  return result === R.PURCHASED || result === R.RESTORED;
}

// Present the RevenueCat paywall. Returns { purchased, result }.
export async function presentPaywall() {
  const UI = RevenueCatUI();
  if (!UI) return { purchased: false, result: 'unavailable' };
  try {
    const options = OFFERING_ID ? { offering: { identifier: OFFERING_ID } } : undefined;
    const result = await UI.presentPaywall(options);
    return { purchased: purchasedFrom(result), result };
  } catch (e) {
    return { purchased: false, result: 'error' };
  }
}

// Present the paywall only if the user doesn't already have Ascend Pro.
export async function presentPaywallIfNeeded() {
  const UI = RevenueCatUI();
  if (!UI) return { purchased: false, result: 'unavailable' };
  try {
    const result = await UI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
      ...(OFFERING_ID ? { offering: { identifier: OFFERING_ID } } : {}),
    });
    return { purchased: purchasedFrom(result), result };
  } catch (e) {
    return { purchased: false, result: 'error' };
  }
}

// Apple-style purchase management (restore, refund request, manage). Configure
// it in RevenueCat → Customer Center.
export async function presentCustomerCenter() {
  const UI = RevenueCatUI();
  if (!UI) return false;
  try {
    await UI.presentCustomerCenter();
    return true;
  } catch (e) {
    return false;
  }
}

// Restore previous purchases. Returns the resulting Pro state.
export async function restorePurchases() {
  const P = Purchases();
  if (!P || !configured) return false;
  try {
    return hasPro(await P.restorePurchases());
  } catch (e) {
    return false;
  }
}

// Localized price of the lifetime package from the current offering, or null.
export async function getOfferingPrice() {
  const P = Purchases();
  if (!P || !configured) return null;
  try {
    const offerings = await P.getOfferings();
    const offering = OFFERING_ID ? offerings.all?.[OFFERING_ID] : offerings.current;
    const pkg = offering?.lifetime || offering?.availablePackages?.[0];
    return pkg?.product?.priceString || null;
  } catch (e) {
    return null;
  }
}

// Whether the paywall/IAP UI can be shown at all (native present + real key).
export function isStoreAvailable() {
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  return Platform.OS === 'ios' && !!RevenueCatUI() && !isPlaceholder(key);
}
