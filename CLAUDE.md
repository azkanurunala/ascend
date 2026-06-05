# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Ascend** — a fully offline, one-touch glassmorphism arcade game in **React Native (Expo SDK 56)**.
The core loop is an **orbit slingshot**: HOLD to latch a luminous orb into orbit around a glowing
gravity well (it charges/spins up while held), RELEASE to fling it off on the tangent toward the
next well. Chain wells to climb through eight altitude bands (meadow → orbit); fall off-screen and
the run ends. The live game canvas is rendered with **React Native Skia**; menus/HUD/overlays are
native RN views using **expo-blur** for real frosted glass.

> History: this was originally a Flappy-Bird-style "tap to flap through pillars" game. It was
> rejected on App Store guideline **4.3(a) (spam — too similar to Flappy Bird)** and the core
> mechanic was overhauled to orbit-slingshot (2026-06). The glass aesthetic, orb, skins, bands and
> the `App.js` contract were kept; only the gameplay loop changed.

## Commands

Skia, Reanimated, SVG and blur are **native modules**, so this needs a **development build — not Expo Go**.

```bash
npm install                       # .npmrc forces legacy-peer-deps (React 19 / Skia 2 peers)
npx expo run:ios                  # compile dev client (needs Xcode), start Metro, launch
npx expo run:android              # needs Android Studio / SDK
npx expo export --platform ios    # bundle without a device — fast check for JS/import/babel errors
npx expo-doctor@latest            # config & dependency health (aim 21/21)
npx expo install --fix            # realign dependencies after an SDK bump (add `-- --legacy-peer-deps`)
node scripts/gen-icon.js          # regenerate assets/icon.png (pure Node, no deps)
```

There is **no test suite, linter, or typecheck** configured — verification is by bundling
(`expo export`) and running on a simulator. In Metro, press `r` to reload.

## Architecture

**Two-world split.** Everything outside a run is plain React Native views (`src/screens/*`,
`src/components/*`) styled in a shared glass language. A run swaps in the Skia engine
(`src/game/GameStage.js`). `src/App.js` decides which is mounted.

**`src/App.js` — the shell + state machine.** A single `Game()` component holds all app state
(best, games, playtime, owned skins, equipped, revive, settings, tweaks) in `useState`, plus
`mode` (`menu` | `playing`) and `tab` (`play` | `ranks` | `skins` | `settings`). Two patterns to know:
- **Load once, then persist per-key**: one effect hydrates everything from `LS` on mount; then one
  `useEffect` *per key* writes it back on change (gated by a `loaded` flag). Add a new persisted
  field by extending both the `multiGet` list and adding a matching write effect.
- **Restart by remount**: starting/retrying a run bumps `runKey`, which is the `<GameStage key={runKey}>` —
  React unmounts and remounts the engine for a clean world. `reviveAt` is a separate counter the
  engine watches to resurrect in place without a remount.

**`src/game/GameStage.js` — the engine (largest file).** All mutable game state lives in a single
ref (`g`), NOT React state — React re-renders only to repaint. The loop is one `requestAnimationFrame`
loop mounted once; props that can change mid-run (`skin`, `paused`, `difficulty`, callbacks…) are
**mirrored into refs** every render so the long-lived loop reads current values without restarting.
Physics is constants-driven (top of the file): `ORB_GRAV` (downward pull you slingshot against),
`SPIN_ACCEL` (how fast a held orbit charges — this is launch power), `SPEED_MIN/MAX`, `CAPTURE_R`
(grab range to a well), `ORBIT_MIN/MAX` (orbit radius), `ANCHOR` (orb's screen height), `ALT_SCALE`
(climb-px per score point), `WELL_BONUS`. The `DIFF` table scales `grav`/`spacing`/`drift` per
difficulty. World `+y` is UP; a peak-following camera maps world→screen. `src/debug.js` has
**temporary** `AUTO_DEMO`/`DEMO_SCORE` flags that auto-start and auto-play a run (no taps) for
capturing real gameplay screenshots — must be `false` for shipping (also `__DEV__`-gated in `App.js`).

**`src/theme.js` — the single source of visual + game truth.** Glass palette (`ASC`), the eight
**altitude bands** (`ASC_BANDS`) with `skyAt(altitude)` interpolating sky colors continuously as you
climb, the six **orb skins** (`ASC_SKINS`, with `core`/`glow`/`trail` colors and price), and font
family names (`FONT`). The equipped skin re-colors the in-game orb, glow and trail. Sky `dark` flag
drives the status-bar style via `onBand`.

**`src/storage.js` — offline persistence.** Thin async AsyncStorage wrapper (`LS.get/set/multiGet`),
all keys prefixed `ascend.`. `today()` returns a local `YYYY-MM-DD` key powering the daily
revive reset (1 free + 1 ad revive/day, capped at 2).

**Monetization is real (RevenueCat IAP only — NO ads).** Premium is a single **Ascend Pro**
lifetime unlock (entitlement `Ascend Pro`) that unlocks all skins + gives unlimited free
revives. `src/iap.js` is the RevenueCat hub (`initIAP` with customer-info listener,
`getProStatus`, `presentPaywall`, `presentCustomerCenter`, `restorePurchases`,
`getOfferingPrice`) using the hosted **Paywall** + **Customer Center** (`react-native-purchases-ui`).
`REVENUECAT_IOS_KEY` in `src/config.js` is the live `appl_…` key. In `App.js`, `pro` is driven by
the RevenueCat listener; `owned = pro ? all skins : ['drift']`; locked skins open the paywall.
**Revives:** free players get 1/day (`FREE_REVIVES_PER_DAY`), beyond that `reviveNow()` opens the
paywall to buy Pro; Pro = unlimited free revives. There are **no ad SDKs** in the build (AdMob +
tracking-transparency were removed), so App Privacy declares no advertising/tracking — just
Purchases (+ Game Center). Dashboard setup is in `MONETIZATION_SETUP.md`.

**Leaderboard is real via Apple Game Center** (iOS-only, no login UI — GameKit auto-auths
the device Apple ID). Native bridge is a **local Expo module**, `modules/expo-game-center/`
(Swift/GameKit: authenticate/submitScore/presentLeaderboard/loadTopScores), wrapped by
`src/leaderboard.js` (graceful no-op fallback). `App.js` signs in on launch + submits on
game over; `LeaderboardScreen` shows live global top-50 (seeded preview as fallback) + a
"View in Game Center" button. Entitlement `com.apple.developer.game-center` is in `app.json`;
leaderboard ID in `config.js`. App Store Connect steps: **`LEADERBOARD_SETUP.md`**. The
native module requires a fresh dev/EAS build to compile in.

## Conventions

- Mutable, per-frame game state goes in **refs**, not `useState` (avoids re-render storms); use
  `setFrame`/`setPhase` only to trigger a repaint. Mirror any prop the loop needs into a ref.
- New cosmetic? add to `ASC_SKINS` in `theme.js` — the store screen and engine read from there.
- Sky/altitude changes are centralized in `ASC_BANDS` + `skyAt`; don't hardcode colors elsewhere.

## Deployment (App Store via EAS)

Full self-contained runbook + the gotchas that have already bitten this project live in
**`MEMORY.md`** (and the global memory). Read it before deploying. The essentials:

- **`.npmrc` (`legacy-peer-deps=true`) is required and committed** — without it the EAS
  "Install dependencies" phase fails on the React 19 / Skia 2 / Reanimated 4 peer ranges. Keep
  `package-lock.json` in sync.
- **Apple requires Xcode 26+** (since 2026-04-28). `eas.json` pins `production.ios.image: "latest"`
  (= Xcode 26.2). The SDK must be 54+ for Xcode 26; this project is on 56.
- EAS builds from the **git snapshot** — commit all changes (including config) before `eas build`.
- Verify locally first (`expo export` → `expo run:ios` → simulator screenshot) before spending EAS quota.
- App Store copy draft is in `APP_STORE_LISTING.md`.
