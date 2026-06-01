# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Ascend** — a fully offline, one-tap glassmorphism arcade game in **React Native (Expo SDK 56)**.
Tap to flap a luminous orb upward against gravity, thread it through frosted-glass pillars, and
climb through eight altitude bands (meadow → orbit). The live game canvas is rendered with
**React Native Skia**; menus/HUD/overlays are native RN views using **expo-blur** for real frosted glass.
It's a faithful re-implementation of a design prototype (see `design_extract/`).

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
Physics is constants-driven (`GRAVITY`, `FLAP`, `BALL_R`) scaled by the `DIFF` table; difficulty
curve (speed up / gap tighten with score) matches the PRD formulas documented in `README.md`.

**`src/theme.js` — the single source of visual + game truth.** Glass palette (`ASC`), the eight
**altitude bands** (`ASC_BANDS`) with `skyAt(altitude)` interpolating sky colors continuously as you
climb, the six **orb skins** (`ASC_SKINS`, with `core`/`glow`/`trail` colors and price), and font
family names (`FONT`). The equipped skin re-colors the in-game orb, glow and trail. Sky `dark` flag
drives the status-bar style via `onBand`.

**`src/storage.js` — offline persistence.** Thin async AsyncStorage wrapper (`LS.get/set/multiGet`),
all keys prefixed `ascend.`. `today()` returns a local `YYYY-MM-DD` key powering the daily
revive reset (1 free + 1 ad revive/day, capped at 2).

**Monetization is mocked** (per the MVP brief): "Unlock $x.xx" instantly grants a skin and
"Revive — watch ad" instantly revives. Wire to real IAP / ad SDKs for production — and if you do,
update the App Privacy disclosures accordingly.

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
