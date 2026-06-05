// Generates original, royalty-free game audio as 16-bit PCM WAV files into
// assets/audio/. Pure Node, no dependencies (run: `node scripts/gen-audio.js`).
// These are simple synthesized placeholders that respond to the Sound setting —
// swap in professionally produced audio later if desired.

const fs = require('fs');
const path = require('path');

const SR = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'audio');
fs.mkdirSync(OUT, { recursive: true });

// --- WAV writer (mono, 16-bit) ---------------------------------------------
function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log('wrote', name, (buf.length / 1024).toFixed(0) + 'KB');
}

const sine = (t, f) => Math.sin(2 * Math.PI * f * t);
const tri = (t, f) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t));
// soft attack + exponential decay envelope
const env = (t, dur, atk = 0.006, k = 5) => {
  const a = Math.min(1, t / atk);
  const d = Math.exp((-k * t) / dur);
  return a * d;
};

// --- one-shot SFX ----------------------------------------------------------
function sfx(name, dur, fn, gain = 0.5) {
  const n = (dur * SR) | 0;
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = fn(i / SR) * gain;
  // 4ms fade-out tail to avoid clicks
  const fade = (0.004 * SR) | 0;
  for (let i = 0; i < fade; i++) s[n - 1 - i] *= i / fade;
  writeWav(name, s);
}

// tap — short soft blip (menu / button)
sfx('tap.wav', 0.07, (t) => sine(t, 660) * env(t, 0.07, 0.004, 7), 0.32);

// grab — quick rising tone (latch onto a well)
sfx('grab.wav', 0.16, (t) => {
  const f = 380 + 360 * Math.min(1, t / 0.16);
  return (sine(t, f) * 0.7 + tri(t, f) * 0.3) * env(t, 0.16, 0.005, 4.5);
}, 0.34);

// launch — slingshot release: bright pluck with a falling pitch
sfx('launch.wav', 0.24, (t) => {
  const f = 600 - 220 * Math.min(1, t / 0.24);
  return (tri(t, f) * 0.6 + sine(t, f * 2) * 0.2) * env(t, 0.24, 0.004, 5);
}, 0.42);

// well — clear chime when a fresh well is grabbed (a fifth: G5 + D6)
sfx('well.wav', 0.5, (t) => {
  const e = env(t, 0.5, 0.004, 4.2);
  return (sine(t, 784) * 0.5 + sine(t, 1175) * 0.32 + sine(t, 1568) * 0.16) * e;
}, 0.38);

// over — gentle descending tone (run ends)
sfx('over.wav', 0.7, (t) => {
  const f = 420 - 260 * Math.min(1, t / 0.7);
  return (sine(t, f) * 0.7 + tri(t, f * 0.5) * 0.3) * env(t, 0.7, 0.006, 3);
}, 0.4);

// --- ambient music loop (seamless) -----------------------------------------
// A slow, airy pad over an A-major-ish chord. Loop length is an exact number
// of seconds so the file loops seamlessly when set to repeat.
(function music() {
  const dur = 16; // seconds (seamless loop)
  const n = dur * SR;
  const s = new Float32Array(n);
  // chord voices (Hz) — A2, E3, A3, C#4, E4
  const voices = [110, 164.81, 220, 277.18, 329.63];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    voices.forEach((f, k) => {
      // slow per-voice tremolo, phases offset, integer cycles over the loop
      const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * ((k + 1) / dur) * t);
      const amp = (k === 0 ? 0.5 : 0.28 / (k * 0.6 + 1)) * (0.55 + 0.45 * lfo);
      v += (Math.sin(2 * Math.PI * f * t) * 0.7 + tri(t, f) * 0.3) * amp;
    });
    // gentle shimmer an octave up
    v += Math.sin(2 * Math.PI * 659.25 * t) * 0.06 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (3 / dur) * t));
    // soft-clip for warmth + clearly audible level (still leaves headroom)
    s[i] = Math.tanh(v * 0.55) * 0.82;
  }
  writeWav('music.wav', s);
})();

console.log('done →', OUT);
