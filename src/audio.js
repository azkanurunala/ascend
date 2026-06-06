// ============ AUDIO ============
// Sound effects + looping background music via expo-audio. Driven by two
// independent settings: initAudio() once, then setMusicEnabled()/setSfxEnabled()
// on toggle, and sfx() for one-shots. All calls are guarded so a failure (e.g.
// asset/codec issue) never crashes gameplay. Assets are generated originals
// (see scripts/gen-audio.js).

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SFX_SOURCES = {
  tap: require('../assets/audio/tap.wav'),
  grab: require('../assets/audio/grab.wav'),
  launch: require('../assets/audio/launch.wav'),
  well: require('../assets/audio/well.wav'),
  over: require('../assets/audio/over.wav'),
};
const SFX_VOL = { tap: 0.5, grab: 0.6, launch: 0.72, well: 0.62, over: 0.7 };

let players = null; // name → AudioPlayer (one-shots)
let music = null; // looping background pad
let musicOn = false; // Music setting
let sfxOn = false; // Sound effects setting
let started = false;

// Create the players once, then honor the Music + Sound-effects settings. Safe
// to call again; later calls just sync the toggle states.
export async function initAudio(musicEnabled, sfxEnabled) {
  musicOn = !!musicEnabled;
  sfxOn = !!sfxEnabled;
  if (started) {
    setMusicEnabled(musicOn);
    setSfxEnabled(sfxOn);
    return;
  }
  started = true;
  try {
    // play through the iOS mute switch — it's a game
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch (e) {}
  try {
    players = {};
    for (const k in SFX_SOURCES) {
      const p = createAudioPlayer(SFX_SOURCES[k]);
      p.volume = SFX_VOL[k] ?? 0.6;
      players[k] = p;
    }
    music = createAudioPlayer(require('../assets/audio/music.wav'));
    music.loop = true;
    music.volume = 0.85;
    if (musicOn) music.play();
  } catch (e) {}
}

// Start/stop the looping background music (Music setting).
export function setMusicEnabled(on) {
  musicOn = !!on;
  if (!music) return;
  try {
    if (musicOn) music.play();
    else music.pause();
  } catch (e) {}
}

// Enable/disable one-shot effects (Sound effects setting).
export function setSfxEnabled(on) {
  sfxOn = !!on;
}

// Fire a one-shot effect by name (no-op when sfx are off / not ready).
export function sfx(name) {
  if (!sfxOn || !players) return;
  const p = players[name];
  if (!p) return;
  try {
    p.seekTo(0);
    p.play();
  } catch (e) {}
}
