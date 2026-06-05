# Ascend

> **Orbit the wells. Slingshot to the stars. How high can you climb?**

A fully-playable, offline-first **glassmorphism** arcade game built in **React Native (Expo)**.
Its core loop is an **orbital slingshot**: hold to latch a luminous glass orb into orbit around a
glowing gravity well (it charges as you hold), then release to fling it off on the tangent toward
the next well. Chain wells to climb through eight altitude bands — from a green meadow, up through
the stratosphere, into aurora and finally orbit, where stars fade in.

The live game canvas is rendered with **React Native Skia**; the menus, HUD and overlays are
native React Native views using **expo-blur** for real frosted glass.

> **Note:** Ascend began as a Flappy-Bird-style tap-to-flap game; after an App Store 4.3(a)
> spam rejection (too similar to Flappy Bird) the core mechanic was rebuilt as the orbit
> slingshot described here. The glass aesthetic, orb, skins and altitude bands were kept.

---

## Gameplay

- **Hold to charge:** pressing latches the orb into orbit around the nearest gravity well and
  spins it up — the longer you hold, the more launch power (and the brighter the orbit ring).
- **Release to slingshot:** the orb flies off along its current travel direction (the tangent),
  arcing under a gentle pull. A live gold **aim arrow** shows where it'll go before you let go.
- **Chain & climb:** as the orb nears the next well, hold again to latch on. Hold–release–hold,
  zig-zagging upward through the bands.
- **Fall = game over:** miss every well and the orb drops off the bottom of the screen.
- **Score = altitude** climbed, plus a **+20 combo** bonus for each fresh well you grab.
- **Difficulty scaling:** `ORB_GRAV` (pull), well `spacing`, and horizontal well `drift` scale
  with the chosen difficulty (chill / normal / intense); wells start drifting at higher altitude.
- **Revive system:** **1 free revive/day** (Ascend Pro = unlimited). Resets at local midnight.

A first-run **how-to-play onboarding** walks through the mechanic (re-openable from the home
screen), and an in-game aim arrow keeps the slingshot direction readable.

## Screens (all in the glass language)

| Screen | What's there |
| --- | --- |
| **Play / Home** | Wordmark, floating hero orb, **Personal best** card with Runs · Playtime · Ceiling · Revive stats, big Play button |
| **Game Over** | Final score, best comparison, **★ New personal best** badge, Play again · Revive · Home |
| **Ranks** | Local **top-50** leaderboard, your rank card, friend tags, weekly "Resets Sun" notice |
| **Skins** | 6 ball cosmetics (owned / locked / equipped), live preview, equip / unlock (\$0.99–\$2.99) — the equipped skin re-colors the in-game orb, glow and trail |
| **Settings** | Sound, Reduced motion, Haptics, Graphics quality toggles · about · **Delete save data** (with confirm) |

A floating **Tweaks** panel (Difficulty + Menu motion) mirrors the prototype's live tuner.

## Features vs. PRD (MVP §7) — all satisfied

**Core:** one-touch orbit slingshot ✓ · procedural gravity wells (spacing/drift scale with score) ✓ ·
fall-to-fail ✓ · score per altitude + well combo ✓ · difficulty scaling ✓ · game over + restart ✓ ·
leaderboard (local, top 50) ✓ · personal best ✓
**Monetization:** cosmetic skins (6) ✓ · trail effects (per-skin trail color) ✓ ·
revives (1 free/day, Ascend Pro = unlimited) ✓ · no energy system ✓
**Offline:** all logic local ✓ · leaderboard cached locally ✓ · zero login ✓ · no permissions ✓
**Juice:** evolving 8-band sky, drifting glass clouds, twinkling stars, particle trail, charge
ring + aim arrow, release sparks, +score pops, screen shake & haptics on death, revive flash.

## Project structure

```
index.js                        # registerRootComponent entry
src/
  App.js                        # state machine, persistence, nav, revive, fonts
  theme.js                      # palette, 8 altitude bands (skyAt), 6 skins, fonts
  storage.js                    # AsyncStorage helpers (offline-first) + daily key
  utils/{color,format}.js       # hex mixing, number/time/price formatting
  game/GameStage.js             # Skia engine: orbit/slingshot physics, wells, camera, juice, HUD
  components/
    Glass.js  Orb.js  SkyBackground.js  BottomNav.js  TweaksPanel.js
    Buttons.js  Controls.js  Icons.js  Float.js  MenuScreen.js
  screens/
    HomeScreen.js  LeaderboardScreen.js  CosmeticsScreen.js
    SettingsScreen.js  GameOverOverlay.js  _ScreenHead.js
```

## Running it

Skia, Reanimated, SVG and blur are **native modules**, so this needs a **development build**
(not Expo Go):

```bash
npm install

# iOS (needs Xcode)
npx expo run:ios

# Android (needs Android Studio / SDK)
npx expo run:android
```

`expo run:*` compiles a dev client containing the native modules, then starts Metro and
launches the app. Press `r` in the Metro terminal to reload.

> Verified: `npx expo export --platform ios` and `--platform android` both bundle cleanly.
> If npm warns about Expo SDK version drift, run `npx expo install --fix`.

### How to play

Tap **Play**, then **hold anywhere** to orbit the nearest gravity well — the longer you hold, the
more it charges. **Release** to slingshot the orb toward the next well (the gold arrow shows the
direction). Hold again as you near it to latch on, and chain wells to climb. Don't fall off-screen.

## Tuning

Open **Tweaks** (bottom-right of the menus) for Difficulty and Menu-motion, or edit the
defaults and difficulty curve in `src/theme.js` and `src/game/GameStage.js`.

## Notes

- **Monetization is mocked** per the MVP brief — "Unlock \$x.xx" instantly grants the skin and
  "Revive — watch ad" instantly revives. Wire these to real IAP / ad SDKs for production.
- The leaderboard is a **local** seed plus your score (PRD: local top-50, optional Firebase sync
  later). No network is used; the game is 100% offline.
