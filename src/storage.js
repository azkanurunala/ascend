// ============ PERSISTENCE ============
// Offline-first local storage (PRD §7: all state on device, zero login).
// Mirrors the prototype's `LS` helper but async (AsyncStorage).

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'ascend.';

export const LS = {
  async get(key, fallback) {
    try {
      const v = await AsyncStorage.getItem(PREFIX + key);
      return v == null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      /* best effort */
    }
  },
  async multiGet(keys) {
    const out = {};
    await Promise.all(
      keys.map(async ([k, d]) => {
        out[k] = await LS.get(k, d);
      })
    );
    return out;
  },
};

// Local date key (YYYY-MM-DD) for the daily revive reset.
export function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
