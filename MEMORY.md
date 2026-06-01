# Ascend — Deployment Knowledge & Contingency Plan

> Self-contained notes so anyone (including Claude in a fresh session) can deploy
> this app — or reuse it as a template for another Expo game — without prior context.
> Mirror of the global memory under `~/.claude/projects/-Users-azkanurunala/memory/`.

## This project at a glance
- **Ascend** — one-tap, offline arcade climber. Glowing orb rises through 8 sky bands
  (Meadow → Open Sky → High Sky → Stratosphere → Mesosphere → Aurora → The Edge → Orbit).
- Stack: **Expo SDK 56**, React Native 0.85, React 19, New Architecture (default).
  Native libs: `@shopify/react-native-skia` 2.x, `react-native-reanimated` 4.x
  (+ `react-native-worklets`), `react-native-svg`, expo-blur/haptics/linear-gradient,
  expo-google-fonts (Space Grotesk / Plus Jakarta Sans / JetBrains Mono).
- Bundle ID: `com.ascend.game`. Apple Team `JWYH3R2628` (individual).
- Icon generator: `scripts/gen-icon.js` (pure Node, no deps) → `assets/icon.png`.
- App Store copy draft: `APP_STORE_LISTING.md`.
- **Monetization is REAL (RevenueCat IAP only — NO ads)** as of 2026-06-01: single
  **Ascend Pro** lifetime unlock (entitlement `Ascend Pro`) → unlocks all skins + unlimited
  free revives, via hosted Paywall + Customer Center (`react-native-purchases` +
  `react-native-purchases-ui`). Wrapper `src/iap.js`; live `appl_…` key in `src/config.js`.
  Free players get 1 revive/day, then the paywall. **AdMob + tracking-transparency were
  removed** → App Privacy declares no ads/tracking (just Purchases + Game Center). Setup: **`MONETIZATION_SETUP.md`**.
- **Real leaderboard via Apple Game Center** (iOS-only, no login UI): local Expo module
  `modules/expo-game-center/` (Swift/GameKit), wrapper `src/leaderboard.js`, entitlement in
  `app.json`, ID in `config.js`. Setup: **`LEADERBOARD_SETUP.md`**. Needs a fresh native build.
- Support + Privacy Policy pages: `docs/index.html` / `docs/privacy.html` (host on GitHub Pages).

## Deploy to the App Store (EAS)
1. Confirm prereqs: paid Apple Developer account; icon 1024×1024 **no alpha**; target (TestFlight vs release).
2. Config already in repo: `app.json` (icon, `ios.bundleIdentifier`, `ITSAppUsesNonExemptEncryption=false`),
   `eas.json` (production profile, `autoIncrement`, `ios.image: "latest"` = Xcode 26.2), `.npmrc`.
3. Install CLI: `npm install -g eas-cli`. Sanity check: `npx expo-doctor@latest` (aim 21/21).
4. **Verify locally before burning EAS quota:**
   - `npx expo export --platform ios`            # JS/babel/import errors
   - `npx expo run:ios`                           # native compile on local Xcode
   - `xcrun simctl io <UDID> screenshot /tmp/x.png`  # confirm it renders
5. Commit everything (EAS builds from the **git snapshot**), then the user runs:
   ```
   eas login
   eas build  --platform ios --profile production    # "Let EAS handle it" for credentials
   eas submit --platform ios --profile production
   ```
6. App Store Connect (manual): screenshots ≥ iPhone 6.7", description/keywords
   (name ≤30, subtitle ≤30, keywords ≤100), **Privacy Policy URL**, App Privacy form,
   age rating → Submit for Review.

## Gotchas that already bit us here (don't repeat)
- **EAS "Install dependencies" fails** → React 19 + Skia 2 + Reanimated 4 peer ranges
  need `--legacy-peer-deps`. Fixed by committed root **`.npmrc`** → `legacy-peer-deps=true`.
  Keep it; keep `package-lock.json` in sync.
- **Apple requires Xcode 26+** (since 2026-04-28). EAS `auto` picks the image by SDK:
  SDK 52 → Xcode 16 (rejected); SDK 54+ → Xcode 26. We upgraded to SDK 56 and pinned
  `eas.json` → `production.ios.image = "latest"`.
- **SDK 52→56 breaking changes** (if upgrading another old project the same way):
  - Reanimated 4: babel plugin `react-native-reanimated/plugin` → `react-native-worklets/plugin`;
    install `react-native-worklets`.
  - `app.json`: remove top-level `splash` and `newArchEnabled`; move splash into the
    `expo-splash-screen` plugin; install `expo-splash-screen`.
  - `babel-preset-expo` can go missing after dependency churn → `npm i -D babel-preset-expo@latest`.
  - Upgrade cmds: `npm install expo@latest` then `npx expo install --fix -- --legacy-peer-deps`.
- Skia used declaratively here (Canvas/Group/Rect/Circle/gradients/BlurMask/vec) — survives 1→2.
  Removed Skia value APIs (`useValue`/`useComputedValue`/`useTouchHandler`/…) do NOT — grep before assuming.

## Reusing this repo as a template for a new game
Change in `app.json`: `name`, `slug`, `ios.bundleIdentifier`, `android.package`.
Regenerate the icon (`node scripts/gen-icon.js` after editing palette/shapes), update
`APP_STORE_LISTING.md`, then follow the deploy steps above. `eas.json`/`.npmrc`/babel
config carry over as-is for this stack.
