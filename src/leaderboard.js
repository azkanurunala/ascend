// ============ LEADERBOARD — Apple Game Center ============
// Safe wrapper over the local native module (modules/expo-game-center). Game
// Center authenticates the player automatically using the Apple ID already on
// the device — there is NO login screen to build. Everything degrades to a
// no-op when the native module isn't present (JS-only bundle, Android, or a
// build made before the module was compiled), so callers never crash.

import { Platform } from 'react-native';
import { leaderboardIdFor } from './config';

// Lazy-load the native bridge; null when unavailable.
function gc() {
  try {
    return require('../modules/expo-game-center').default;
  } catch (e) {
    console.warn('[GameCenter] native module unavailable:', e?.message || e);
    return null;
  }
}

export const isLeaderboardAvailable = () => Platform.OS === 'ios' && !!gc();

// Sign the player into Game Center (shows Apple's banner the first time).
export async function authenticateGameCenter() {
  const m = gc();
  if (!m) return false;
  try {
    const ok = await m.authenticate();
    console.log('[GameCenter] authenticate ->', ok);
    return ok;
  } catch (e) {
    console.warn('[GameCenter] authenticate error:', e?.message || e);
    return false;
  }
}

export async function isAuthenticated() {
  const m = gc();
  if (!m) return false;
  try {
    return await m.isAuthenticated();
  } catch (e) {
    console.warn('[GameCenter] isAuthenticated error:', e?.message || e);
    return false;
  }
}

// Submit a run/best score to that difficulty's board. Game Center keeps the
// player's highest automatically.
export async function submitScore(score, difficulty) {
  const m = gc();
  if (!m || !score || score <= 0) return false;
  try {
    return await m.submitScore(Math.floor(score), leaderboardIdFor(difficulty));
  } catch (e) {
    return false;
  }
}

// Open Apple's native leaderboard screen for a difficulty.
export async function presentLeaderboard(difficulty) {
  const m = gc();
  if (!m) return false;
  const id = leaderboardIdFor(difficulty);
  try {
    const presented = await m.presentLeaderboard(id);
    console.log('[GameCenter] presentLeaderboard', id, '->', presented);
    return presented;
  } catch (e) {
    console.warn('[GameCenter] presentLeaderboard error', id, ':', e?.message || e);
    return false;
  }
}

// Fetch the top N entries for a difficulty to render in the app's own glass UI.
// Returns [{ rank, name, score, me }] — empty array if unavailable.
export async function loadTopScores(difficulty, count = 50) {
  const m = gc();
  if (!m) return [];
  try {
    const rows = await m.loadTopScores(leaderboardIdFor(difficulty), count);
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}
