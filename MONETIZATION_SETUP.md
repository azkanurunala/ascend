# Monetization Setup — Ads (AdMob) + IAP (RevenueCat)

This is the account/dashboard work that only you can do. The **code is already
wired** — flip it on by filling in the real keys in [`src/config.js`](src/config.js)
and the AdMob app IDs in [`app.json`](app.json), then rebuild.

Until you do, the app runs in **safe mock-ish mode**: Google's official *test* ads
show, and purchases fail gracefully with an alert (no crash). That's expected.

---

## What's already done in code
- `src/config.js` — all keys/IDs live here (placeholders today).
- `src/ads.js` — AdMob rewarded ad; powers the 2nd daily revive ("watch ad").
- `src/iap.js` — RevenueCat non-consumable skins + restore.
- `src/App.js` — `buy()` runs a real purchase; `reviveNow()` shows the ad; Settings
  has **Restore purchases**; owned skins reconcile with the store on launch.
- `theme.js` — each paid skin has a `productId` (`com.ascend.game.skin.<id>`).
- `app.json` — AdMob + App Tracking Transparency plugins (with test app IDs).

The **only free skin is `drift`**. Ember, Neon, Amethyst, Rosegold and Aurora are
now real purchases (was a mock freebie before).

---

## A. In-App Purchases (RevenueCat + App Store Connect)

1. **Sign Apple's Paid Apps Agreement.** App Store Connect → Business → Agreements.
   *IAP will not work at all until this is "Active".*
2. **Create 5 non-consumable products** in App Store Connect → your app → In-App
   Purchases. Use these exact product IDs (they must match `theme.js`):
   | Skin | Product ID | Suggested price |
   |------|-----------|-----------------|
   | Ember | `com.ascend.game.skin.ember` | $0.99 |
   | Neon | `com.ascend.game.skin.neon` | $0.99 |
   | Amethyst | `com.ascend.game.skin.amethyst` | $1.99 |
   | Rosegold | `com.ascend.game.skin.rose` | $1.99 |
   | Aurora | `com.ascend.game.skin.aurora` | $2.99 |
   Give each a display name + review screenshot. Status will be "Ready to Submit".
3. **RevenueCat** (revenuecat.com, free tier): create a Project → add an App for the
   Apple App Store (bundle `com.ascend.game`). Upload your **App Store Connect API
   key** (or in-app purchase key) so RevenueCat can validate receipts.
4. Import/auto-sync the 5 products into RevenueCat. (You don't strictly need
   Offerings/Entitlements — the code purchases products directly and reads ownership
   from purchase history — but configuring them does no harm.)
5. Copy the RevenueCat **Apple public API key** (`appl_…`) into
   `REVENUECAT_IOS_KEY` in `src/config.js`.
6. **Test** with a Sandbox Apple ID (App Store Connect → Users and Access → Sandbox
   Testers) on a real device dev build.

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
   The native modules (AdMob, Purchases, tracking-transparency) require this fresh
   build — they can't hot-reload into the old one.
3. In **App Store Connect**, attach the new build, **add the 5 IAPs to the version**
   (In-App Purchases section of the version page) so they're reviewed together.

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
