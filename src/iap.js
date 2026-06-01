// ============ IAP — RevenueCat in-app purchases (orb skins) ============
// Thin wrapper over react-native-purchases. Exposes:
//   initIAP()             — configure the SDK once on app start
//   syncOwnedSkins()      — Promise<string[]>: skin ids the user already owns
//   fetchPrices()         — Promise<{[skinId]: "$0.99"}> localized store prices
//   purchaseSkin(skinId)  — Promise<{ok, cancelled, error}>
//   restorePurchases()    — Promise<string[]>: skin ids restored
//
// Skins are non-consumable products. The product id for a skin is taken from
// `productId` in ASC_SKINS (theme.js); create those same ids in App Store
// Connect and import them into RevenueCat. All native access is guarded so a
// missing module / unconfigured key never crashes the game.

import { Platform } from 'react-native';
import { ASC_SKINS } from './theme';
import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY, isPlaceholder } from './config';

function rc() {
  try {
    return require('react-native-purchases').default;
  } catch (e) {
    return null;
  }
}

// productId -> skinId and the reverse, built from theme.js.
const SKIN_BY_PRODUCT = {};
const PRODUCT_IDS = [];
for (const s of ASC_SKINS) {
  if (s.productId) {
    SKIN_BY_PRODUCT[s.productId] = s.id;
    PRODUCT_IDS.push(s.productId);
  }
}

let configured = false;

export function initIAP() {
  const Purchases = rc();
  if (!Purchases || configured) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  if (isPlaceholder(key)) return; // no real key yet — stay in mock mode
  try {
    Purchases.configure({ apiKey: key });
    configured = true;
  } catch (e) {
    /* leave unconfigured */
  }
}

// Pull every purchased product id out of a RevenueCat customerInfo object,
// tolerating the few shapes the SDK has used across versions.
function purchasedProductIds(info) {
  if (!info) return [];
  if (Array.isArray(info.allPurchasedProductIdentifiers)) {
    return info.allPurchasedProductIdentifiers;
  }
  const txns = info.nonSubscriptionTransactions || [];
  return txns.map((t) => t.productIdentifier).filter(Boolean);
}

function skinsFromInfo(info) {
  return purchasedProductIds(info)
    .map((pid) => SKIN_BY_PRODUCT[pid])
    .filter(Boolean);
}

// Skins the store says this Apple ID already owns (used to reconcile on launch).
export async function syncOwnedSkins() {
  const Purchases = rc();
  if (!Purchases || !configured) return [];
  try {
    const info = await Purchases.getCustomerInfo();
    return skinsFromInfo(info);
  } catch (e) {
    return [];
  }
}

// Localized price strings keyed by skin id, e.g. { ember: "$0.99" }.
export async function fetchPrices() {
  const Purchases = rc();
  if (!Purchases || !configured || PRODUCT_IDS.length === 0) return {};
  try {
    const products = await Purchases.getProducts(PRODUCT_IDS);
    const out = {};
    for (const p of products) {
      const skinId = SKIN_BY_PRODUCT[p.identifier];
      if (skinId) out[skinId] = p.priceString;
    }
    return out;
  } catch (e) {
    return {};
  }
}

// Buy a skin. Returns { ok, cancelled, error }.
export async function purchaseSkin(skinId) {
  const Purchases = rc();
  const skin = ASC_SKINS.find((s) => s.id === skinId);
  if (!Purchases || !configured || !skin || !skin.productId) {
    return { ok: false, error: 'Purchases are not available right now.' };
  }
  try {
    const products = await Purchases.getProducts([skin.productId]);
    const product = products.find((p) => p.identifier === skin.productId);
    if (!product) return { ok: false, error: 'This item is not available.' };
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    const owns = skinsFromInfo(customerInfo).includes(skinId);
    return { ok: owns };
  } catch (e) {
    if (e && e.userCancelled) return { ok: false, cancelled: true };
    return { ok: false, error: (e && e.message) || 'Purchase failed.' };
  }
}

// Restore previous non-consumable purchases. Returns owned skin ids.
export async function restorePurchases() {
  const Purchases = rc();
  if (!Purchases || !configured) return [];
  try {
    const info = await Purchases.restorePurchases();
    return skinsFromInfo(info);
  } catch (e) {
    return [];
  }
}
