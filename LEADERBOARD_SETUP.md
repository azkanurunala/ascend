# Leaderboard Setup — Apple Game Center

The leaderboard is **real, via Apple Game Center**. There is **no login to build**:
GameKit authenticates the player automatically with the Apple ID already signed
into their device. The code is wired — you only do the App Store Connect setup
below, then make a fresh dev build (the native module must compile in).

## What's already done in code
- `modules/expo-game-center/` — local Expo module (Swift/GameKit): `authenticate`,
  `isAuthenticated`, `submitScore`, `presentLeaderboard`, `loadTopScores`.
- `src/leaderboard.js` — safe JS wrapper (no-ops if the native module is absent).
- `src/App.js` — signs in on launch; submits the score on every game over.
- `src/screens/LeaderboardScreen.js` — renders **real** global top-50 when signed
  in (falls back to the seeded preview otherwise) + "View in Game Center" button.
- `app.json` — Game Center entitlement (`com.apple.developer.game-center`).
- `src/config.js` — `GAME_CENTER_LEADERBOARD_ID = 'ascend.altitude.alltime'`.

## App Store Connect steps (you)
1. **Enable Game Center for the App ID.** Apple Developer → Certificates,
   Identifiers & Profiles → your App ID (`com.ascend.game`) → enable **Game Center**.
   (EAS-managed credentials usually handle this when the entitlement is present,
   but verify it's on.)
2. **Create the leaderboard.** App Store Connect → your app → **Services →
   Game Center → Leaderboards** → add a **Classic** leaderboard:
   - **Leaderboard ID:** `ascend.altitude.alltime` *(must match `src/config.js`)*
   - **Score format:** Integer
   - **Sort order:** High to Low
   - **Score range** (optional): e.g. 0–10000000
   - Add a leaderboard name + localization (e.g. "Altitude").
3. **Rebuild & submit** — the native module needs a fresh binary:
   ```
   git add -A && git commit
   eas build -p ios --profile production
   eas submit -p ios --profile production
   ```
4. **Test** on a real device dev build with a Sandbox Game Center account
   (Settings → Game Center, or the sandbox prompt). The simulator can sign in to
   Game Center in recent Xcode, but test scores on a device to be safe.

## Notes
- **iOS only.** On Android the wrapper returns empty/false and the screen shows
  the seeded preview. Add Google Play Games separately if you go cross-platform.
- New Game Center leaderboards can take a little while to start returning entries
  the first time; an empty global list right after creation is normal.
- The seeded names in `LeaderboardScreen.js` are only the *offline preview*. Once
  signed in with real entries, they're replaced by live Game Center data.

## App Privacy
Game Center processes a **Game Center player ID** and public **display name**.
This is generally disclosed under **Identifiers** / **User Content** used for
*App Functionality* (not tracking). The privacy policy in `docs/privacy.html`
notes Apple/Game Center as a provider.
