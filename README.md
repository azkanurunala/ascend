# Ascend

> **Tap to rise. Dodge to survive. How high can you go?**

A fully-playable, offline-first **glassmorphism** hypercasual game built in **React Native (Expo)**.
You tap to flap a luminous glass orb upward against gravity and thread it through drifting
frosted-glass pillars while the sky evolves through eight altitude bands — from a green meadow,
up through the stratosphere, into aurora and finally orbit, where stars fade in.

This is a faithful, pixel-considered re-implementation of the `Ascend.html` design prototype
(from Claude Design). The live game canvas is rendered with **React Native Skia**; the menus,
HUD and overlays are native React Native views using **expo-blur** for real frosted glass.

---

## Gameplay

- **One-tap mechanic** (PRD §3): each tap applies an upward impulse; gravity constantly pulls
  the orb down. Net motion is up while you keep tapping.
- **Procedural frosted-glass pillars** with random gaps scroll toward you.
- **Collision** ends the run; floor/ceiling are lethal too.
- **Score** ticks up with distance and jumps **+50** each time you clear a pillar.
- **Difficulty scaling** (PRD §3.2 formulas): speed rises and the gap tightens as the score
  grows — `speed = min(360, 156 + score·0.02)`, `gap = max(146, 248 − score·0.0135)`,
  scaled by the chosen difficulty (chill / normal / intense).
- **Revive system** (PRD §15): **1 free revive/day**, plus **1 optional "watch ad" revive**
  (capped at 2/day). Resets at local midnight.

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

**Core:** one-tap gravity ✓ · procedural obstacles (spacing decreases over time) ✓ · collision ✓ ·
score per obstacle ✓ · difficulty scaling (speed + spacing) ✓ · game over + restart ✓ ·
leaderboard (local, top 50) ✓ · personal best ✓
**Monetization:** cosmetic skins (6) ✓ · trail effects (per-skin trail color) ✓ ·
optional ad revive (1 free + 1 ad/day) ✓ · no energy system ✓
**Offline:** all logic local ✓ · leaderboard cached locally ✓ · zero login ✓ · no permissions ✓
**Juice:** evolving 8-band sky, drifting glass clouds, twinkling stars, particle trail, flap
sparks, +score pops, screen shake & haptics on death, revive flash.

## Project structure

```
index.js                        # registerRootComponent entry
src/
  App.js                        # state machine, persistence, nav, revive, fonts
  theme.js                      # palette, 8 altitude bands (skyAt), 6 skins, fonts
  storage.js                    # AsyncStorage helpers (offline-first) + daily key
  utils/{color,format}.js       # hex mixing, number/time/price formatting
  game/GameStage.js             # Skia engine: physics, pillars, collision, juice, HUD
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

Tap **Play**, then tap **anywhere** to flap upward. Keep tapping to stay aloft and thread the
orb through each gap. Don't hit a pillar, the ceiling, or the floor.

## Tuning

Open **Tweaks** (bottom-right of the menus) for Difficulty and Menu-motion, or edit the
defaults and difficulty curve in `src/theme.js` and `src/game/GameStage.js`.

## Notes

- **Monetization is mocked** per the MVP brief — "Unlock \$x.xx" instantly grants the skin and
  "Revive — watch ad" instantly revives. Wire these to real IAP / ad SDKs for production.
- The leaderboard is a **local** seed plus your score (PRD: local top-50, optional Firebase sync
  later). No network is used; the game is 100% offline.
