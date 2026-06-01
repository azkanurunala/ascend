# Monetization Setup — Ads (AdMob) + IAP (RevenueCat)

This is the account/dashboard work that only you can do. The **code is already
wired** — flip it on by filling in the real keys in [`src/config.js`](src/config.js)
and the AdMob app IDs in [`app.json`](app.json), then rebuild.

Until you do, the app runs in **safe mock-ish mode**: Google's official *test* ads
show, and purchases fail gracefully with an alert (no crash). That's expected.

---

## The model: "Ascend Pro" (one lifetime unlock)

Instead of selling skins individually, a single **Ascend Pro** lifetime purchase
grants the **`Ascend Pro` entitlement**, which unlocks **every orb skin** and
makes **revives free** (no ad). Selling is done through RevenueCat's **hosted
Paywall**; managing/restoring through the **Customer Center**. Prices and the
product list live in the RevenueCat/Apple dashboards — the app hardcodes neither.

## What's already done in code
- `src/config.js` — `REVENUECAT_IOS_KEY` (currently a `test_…` sandbox key),
  `ENTITLEMENT_ID = 'Ascend Pro'`, `OFFERING_ID`, AdMob IDs.
- `src/iap.js` — RevenueCat hub: `initIAP` (configure + customer-info listener),
  `getProStatus`, `presentPaywall`, `presentCustomerCenter`, `restorePurchases`,
  `getOfferingPrice`.
- `src/App.js` — `pro` state driven by the RevenueCat listener; owned skins =
  all skins when Pro; locked skins / "Unlock Ascend Pro" open the **Paywall**;
  Pro skips the revive ad.
- `src/screens/CosmeticsScreen.js` — locked skins show **PRO**, unlock via paywall.
- `src/screens/SettingsScreen.js` — Ascend Pro status + **Restore** + **Manage
  purchases** (Customer Center).
- `app.json` — AdMob + App Tracking Transparency plugins (test app IDs).

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
5. Copy RevenueCat → **API Keys → public Apple key `appl_…`** into
   `REVENUECAT_IOS_KEY` in `src/config.js` (replacing the `test_…` sandbox key)
   for the production build.
6. **Test** with a Sandbox Apple ID (Users and Access → Sandbox Testers) on a real
   device dev build. The `test_…` key works against RevenueCat's Test Store without
   App Store Connect, useful for checking the paywall UI early.

## B. Rewarded Ads (Google AdMob)

1. Create an **AdMob account** (admob.google.com) and **register the app** (iOS,
   bundle `com.ascend.game`). You'll get an **App ID** `ca-app-pub-XXXX~YYYY`.
2. Create a **Rewarded** ad unit → you'll get a unit ID `ca-app-pub-XXXX/ZZZZ`.
3. Put the real values in two places:
   - `src/config.js` → `ADMOB_IOS_APP_ID`, `ADMOB_IOS_REWARDED_UNIT`.
   - `app.json` → `plugins → react-native-google-mobile-ads → iosAppId`.
4. Set `USE_TEST_ADS = false` in `src/config.js` **only for the release build**.
   ⚠️ Never tap a real ad you own during testing — AdMob can ban the account. Keep
   `USE_TEST_ADS = true` while developing.
5. Link AdMob to AdSense and add **payment details** to get paid.

## C. Rebuild + resubmit
1. `git add -A && git commit` (EAS builds from the git snapshot).
2. `eas build -p ios --profile production` then `eas submit -p ios --profile production`.
   The native modules (AdMob, Purchases + Purchases-UI, tracking-transparency,
   Game Center) require this fresh build — they can't hot-reload into the old one.
3. In **App Store Connect**, attach the new build, and **add the `lifetime` IAP to
   the version** (In-App Purchases section of the version page) so it's reviewed
   together with the app.

## D. App Privacy form (IMPORTANT — changed)
You can **no longer** declare "Data Not Collected". With AdMob + IAP, declare:
- **Identifiers → Device ID** — used for *Third-Party Advertising* (AdMob). Linked
  to identity: No. Tracking: Yes *only if* you enable personalized ads / show the
  ATT prompt.
- **Purchases** — purchase history (IAP), used for App Functionality.
- **Usage Data** — product interaction (AdMob measurement), used for Advertising.
- Set the **age rating** ad question to indicate ads are present.
- Privacy Policy URL is **required** (already drafted in `docs/privacy.html`, now
  updated to disclose AdMob/RevenueCat/Apple).

See AdMob's own "Apple privacy questionnaire" guidance for the exact toggles, as
Apple's form wording shifts over time.
