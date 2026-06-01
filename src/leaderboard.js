// ============ LEADERBOARD — Apple Game Center ============
// Safe wrapper over the local native module (modules/expo-game-center). Game
// Center authenticates the player automatically using the Apple ID already on
// the device — there is NO login screen to build. Everything degrades to a
// no-op when the native module isn't present (JS-only bundle, Android, or a
// build made before the module was compiled), so callers never crash.

import { Platform } from 'react-native';
import { GAME_CENTER_LEADERBOARD_ID } from './config';

// Lazy-load the native bridge; null when unavailable.
function gc() {
  try {
    return require('../modules/expo-game-center').default;
  } catch (e) {
    return null;
  }
}

export const isLeaderboardAvailable = () => Platform.OS === 'ios' && !!gc();

// Sign the player into Game Center (shows Apple's banner the first time).
export async function authenticateGameCenter() {
  const m = gc();
  if (!m) return false;
  try {
    return await m.authenticate();
  } catch (e) {
    return false;
  }
}

export async function isAuthenticated() {
  const m = gc();
  if (!m) return false;
  try {
    return await m.isAuthenticated();
  } catch (e) {
    return false;
  }
}

// Submit a run/best score. Game Center keeps the player's highest automatically.
export async function submitScore(score) {
  const m = gc();
  if (!m || !score || score <= 0) return false;
  try {
    return await m.submitScore(Math.floor(score), GAME_CENTER_LEADERBOARD_ID);
  } catch (e) {
    return false;
  }
}

// Open Apple's native global leaderboard screen.
export async function presentLeaderboard() {
  const m = gc();
  if (!m) return false;
  try {
    return await m.presentLeaderboard(GAME_CENTER_LEADERBOARD_ID);
  } catch (e) {
    return false;
  }
}

// Fetch the top N global entries to render in the app's own glass UI.
// Returns [{ rank, name, score, me }] — empty array if unavailable.
export async function loadTopScores(count = 50) {
  const m = gc();
  if (!m) return [];
  try {
    const rows = await m.loadTopScores(GAME_CENTER_LEADERBOARD_ID, count);
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    return [];
  }
}
