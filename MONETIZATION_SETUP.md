# Monetization Setup — IAP (RevenueCat). No ads.

This is the account/dashboard work that only you can do. The **code is already
wired** with your `appl_` key.

**No ads.** The app shows no advertising and has no ad/tracking SDKs — so App
Privacy is simple and there's no AdMob account to set up.

---

## The model: "Ascend Pro" (one lifetime unlock)

A single **Ascend Pro** lifetime purchase grants the **`Ascend Pro` entitlement**,
which unlocks **every orb skin** and gives **unlimited free revives**. Free players
get **one revive per day**; beyond that, reviving opens the paywall to buy Ascend
Pro. Selling is done through RevenueCat's **hosted Paywall**; managing/restoring
through the **Customer Center**. Prices and the product list live in the
RevenueCat/Apple dashboards — the app hardcodes neither.

## What's already done in code
- `src/config.js` — `REVENUECAT_IOS_KEY` (your live `appl_…` key),
  `ENTITLEMENT_ID = 'Ascend Pro'`, `OFFERING_ID`.
- `src/iap.js` — RevenueCat hub: `initIAP` (configure + customer-info listener),
  `getProStatus`, `presentPaywall`, `presentCustomerCenter`, `restorePurchases`,
  `getOfferingPrice`.
- `src/App.js` — `pro` state driven by the RevenueCat listener; owned skins =
  all skins when Pro; locked skins / "Unlock Ascend Pro" open the **Paywall**;
  the daily-limit revive opens the paywall instead of an ad.
- `src/screens/CosmeticsScreen.js` — locked skins show **PRO**, unlock via paywall.
- `src/screens/SettingsScreen.js` — Ascend Pro status + **Restore** + **Manage
  purchases** (Customer Center).

Only `drift` is free; the other skins unlock with Ascend Pro.

---

## A. In-App Purchase: Ascend Pro (RevenueCat + App Store Connect)

1. **Sign Apple's Paid Apps Agreement.** App Store Connect → Business → Agreements.
   *IAP will not work at all until this is "Active".*
2. **Create the product** in App Store Connect → your app → In-App Purchases →
   **non-consumable**:
   - **Product ID:** `lifetime` (or `com.ascend.game.lifetime` — just match it in
     RevenueCat)
   - Reference name "Ascend Pro Lifetime", a price tier (e.g. $4.99), display name
     + a review screenshot. Status → "Ready to Submit".
3. **RevenueCat** (revenuecat.com): create a Project → add an App for the Apple App
   Store (bundle `com.ascend.game`). Upload the **In-App Purchase key** you
   generated (the `.p8` + Issuer ID `63f66b92-…` + Key ID `3S946XCN8A`) so it can
   validate receipts.
4. In RevenueCat:
   - **Entitlements** → create one with identifier **`Ascend Pro`** (must match
     `ENTITLEMENT_ID` in `config.js` *exactly*, including the space).
   - **Products** → add the `lifetime` product; attach it to the `Ascend Pro`
     entitlement.
   - **Offerings** → create an offering (the default "current"), add the `lifetime`
     product as the **Lifetime** package.
   - **Paywalls** → design a paywall for that offering (this is what
     `presentPaywall()` shows). Without a paywall configured, the paywall call
     returns "not presented".
   - **Customer Center** → enable/configure it (powers "Manage purchases").
5. ✅ The public Apple key `appl_…` is **already wired** into `REVENUECAT_IOS_KEY`
   in `src/config.js`.
6. **Test** with a Sandbox Apple ID (Users and Access → Sandbox Testers) on a real
   device build (Simulator StoreKit is limited).

## B. Rebuild + resubmit
1. `git add -A && git commit` (EAS builds from the git snapshot).
2. `eas build -p ios --profile production` then `eas submit -p ios --profile production`.
   The native modules (RevenueCat Purchases + Purchases-UI, Game Center) require this
   fresh build — they can't hot-reload into the old one.
3. In **App Store Connect**, attach the new build, and **add the `lifetime` IAP to
   the version** (In-App Purchases section of the version page) so it's reviewed
   together with the app.

## C. App Privacy form
**No ads, no tracking.** Declare only:
- **Purchases** — purchase history (the Ascend Pro IAP), used for *App Functionality*.
  Not linked to identity, not used for tracking.
- **Identifiers / User Content (Game Center)** — if you keep the leaderboard, the
  Game Center player ID + display name are processed by Apple for *App Functionality*.
- No advertising data, no Device ID for ads, **no tracking** → you do **not** show an
  ATT prompt.
- Privacy Policy URL is **required** (`docs/privacy.html`, updated: no ads).
