// ============ TEMPORARY CAPTURE / DEMO FLAGS ============
// Set AUTO_DEMO = true to make the app skip the menu, auto-start a run, and
// auto-PLAY it (the orb grabs wells, charges, and slingshots on its own — no
// taps needed). This lets us capture REAL gameplay frames from the simulator
// for App Store screenshots (Apple guideline 2.3.3 wants real captures).
//
// DEMO_SCORE starts the demo run near a given score so we can capture every
// altitude band (e.g. 0 = Meadow/Open Sky, 6200 = Aurora, 12000 = Orbit).
//
// ⚠️  BOTH MUST BE RESET BEFORE SHIPPING — AUTO_DEMO=false, DEMO_SCORE=0.
//     App.js also gates AUTO_DEMO behind __DEV__ so it can never reach the
//     App Store even if left on by accident.
export const AUTO_DEMO = true;
export const DEMO_SCORE = 0;

// Force the initial screen on launch so each can be screenshotted without
// tapping the nav (simulator input is blocked here). __DEV__-gated in App.js.
// null | 'play' | 'ranks' | 'skins' | 'settings' | 'tutorial'.  Reset to null to ship.
export const DEMO_SCREEN = null;
