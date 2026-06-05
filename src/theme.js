// ============ ASCEND THEME ============
// Glassmorphism palette, altitude sky bands, ball cosmetics.
// Ported 1:1 from the design bundle (assets/ascend-theme.jsx).

import { mixHex } from './utils/color';

// ink / glass over the sky
export const ASC = {
  ink: '#0F1A2B',
  ink2: 'rgba(15,26,43,0.62)',
  ink3: 'rgba(15,26,43,0.40)',
  inkOn: '#F4F8FF', // ink for use on dark / space sky
  inkOn2: 'rgba(244,248,255,0.66)',
  glass: 'rgba(255,255,255,0.30)',
  glassHi: 'rgba(255,255,255,0.46)',
  glassDk: 'rgba(255,255,255,0.16)',
  hair: 'rgba(255,255,255,0.55)',
  hairDk: 'rgba(255,255,255,0.18)',
  shadow: 'rgba(20,40,80,0.22)',
  // accents
  gold: '#F2B33D',
  mint: '#4FE0B0',
  sky: '#5AA9F2',
  violet: '#A98CF5',
  rose: '#F2719B',
  danger: '#FF6B5E',
};

// Altitude bands — each anchor is [skyTop, skyBottom, fog, isDark].
// We interpolate between anchors by altitude for a continuous climb.
export const ASC_BANDS = [
  { at: 0, top: '#BFE3D0', bot: '#EAF3E4', fog: '#FFFFFF', dark: false, name: 'Meadow' },
  { at: 400, top: '#7FC8E8', bot: '#CDEBF0', fog: '#EAF6FB', dark: false, name: 'Open Sky' },
  { at: 1200, top: '#4E93D8', bot: '#9FD0EE', fog: '#DCEBFB', dark: false, name: 'High Sky' },
  { at: 2600, top: '#3257A8', bot: '#6E8FD6', fog: '#C6D3F0', dark: false, name: 'Stratosphere' },
  { at: 4200, top: '#2B2C6B', bot: '#4B4AA0', fog: '#9C97D8', dark: true, name: 'Mesosphere' },
  { at: 6200, top: '#172048', bot: '#3A2F74', fog: '#6E5CB0', dark: true, name: 'Aurora' },
  { at: 8500, top: '#070A1B', bot: '#161A3A', fog: '#2A2F5C', dark: true, name: 'The Edge' },
  { at: 12000, top: '#02030A', bot: '#080A1C', fog: '#141738', dark: true, name: 'Orbit' },
];

// Resolve sky for a given altitude → { top, bot, fog, dark, name }
export function skyAt(alt) {
  const B = ASC_BANDS;
  if (alt <= B[0].at) return { ...B[0] };
  if (alt >= B[B.length - 1].at) return { ...B[B.length - 1] };
  let i = 0;
  while (i < B.length - 1 && B[i + 1].at <= alt) i++;
  const a = B[i];
  const b = B[i + 1];
  const t = (alt - a.at) / (b.at - a.at);
  return {
    top: mixHex(a.top, b.top, t),
    bot: mixHex(a.bot, b.bot, t),
    fog: mixHex(a.fog, b.fog, t),
    dark: t > 0.5 ? b.dark : a.dark,
    name: t > 0.5 ? b.name : a.name,
  };
}

// Ball cosmetics. core = orb fill, glow = halo color, trail = particle color.
// price 0 → unlocked by Ascend Pro (drift is the free default). rainbow = animated.

// HSL → hex (h: 0-360, s/l: 0-1) for building orb palettes.
function hslToHex(h, s, l) {
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) { r = c; g = x; } else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; } else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; } else { r = c; b = x; }
  const m = l - c / 2;
  const to = (v) => ('0' + Math.round((v + m) * 255).toString(16)).slice(-2);
  return ('#' + to(r) + to(g) + to(b)).toUpperCase();
}

// Build one named orb. The body is a real two-color gradient from c1 → c2; `cs`
// (hue shift) sets how different the second color is. cs ≈ 0 → smooth single
// hue; large cs → bold two-color orbs (e.g. blue→green). `glow` is the halo.
function makeSkin([name, h, s, l, cs, tag]) {
  const c1 = hslToHex(h, s, l);
  const c2 = hslToHex(h + cs, s, l);
  const glow = hslToHex(h + cs / 2, Math.min(s + 0.06, 1), Math.min(0.64, l + 0.08));
  const trail = hslToHex(h + cs / 2, s * 0.72, Math.min(0.84, l + 0.18));
  const core = hslToHex(h, Math.min(s * 0.4, 0.4), 0.93); // soft highlight tint
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, c1, c2, glow, core, trail, price: 0, tag };
}

// Build a MULTI-color orb from explicit hex stops (e.g. sunset, ocean). The
// body renders every stop as one smooth diagonal sweep; glow/trail derive from
// the middle stop, lightened. `colors` can hold 2, 3, or 4 stops.
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
function makeGrad([name, colors, tag = 'Gradient']) {
  const mid = colors[Math.floor((colors.length - 1) / 2)];
  return {
    id: slug(name),
    name,
    colors,
    c1: colors[0],
    c2: colors[colors.length - 1],
    glow: mixHex(mid, '#FFFFFF', 0.16),
    trail: mixHex(mid, '#FFFFFF', 0.34),
    core: '#F6FBFF',
    price: 0,
    tag,
  };
}

// Distinct SOLID orbs — one per color family, ~35°+ apart so none look alike.
// [name, hue, sat, light, hueShift, tag].
const SOLID_SPECS = [
  ['Crimson', 352, 0.9, 0.5, 0, 'Bold'],
  ['Tangerine', 26, 0.95, 0.56, 0, 'Bold'],
  ['Gold', 46, 0.95, 0.55, 0, 'Bold'],
  ['Lime', 92, 0.9, 0.56, 0, 'Neon'],
  ['Emerald', 150, 0.88, 0.46, 0, 'Bold'],
  ['Cyan', 188, 0.95, 0.56, 0, 'Neon'],
  ['Cobalt', 226, 0.92, 0.52, 0, 'Bold'],
  ['Violet', 278, 0.85, 0.6, 0, 'Bold'],
  ['Magenta', 312, 0.95, 0.55, 0, 'Neon'],
];

// Multi-color GRADIENT orbs — the showcase. Each is a REAL multi-hue blend:
// [name, [stops…], tag?]. Deliberately contrasting (e.g. blue+green, pink+blue)
// so a single orb visibly holds two or three colors at once. Bold combos lead.
const GRADIENT_SPECS = [
  ['Tide', ['#2BE0A6', '#2E86E8']],               // green ↔ blue
  ['Spring', ['#C0F65A', '#34D399', '#2E86E8']],  // lime → green → blue
  ['Peacock', ['#12E0C4', '#2E6FE0', '#7A4ED8']], // teal → blue → violet
  ['Citrus', ['#FFE15A', '#3DE08A']],             // yellow ↔ green
  ['Mojito', ['#CFFF6A', '#1FC9A8']],             // lime ↔ teal
  ['Forest', ['#9AE66E', '#1E8A5A']],             // bright ↔ deep green
  ['Galaxy', ['#3A8FE0', '#A06CF0', '#FF6FD8']],  // blue → purple → pink
  ['Nebula', ['#2BE0E0', '#6C7AF0', '#C06CF0']],  // cyan → indigo → purple
  ['Marine', ['#3DE0E0', '#2E4FE0']],             // cyan ↔ deep blue
  ['Seabreeze', ['#A8F0E0', '#6CA0F0']],          // aqua ↔ sky (pale)
  ['Sunset', ['#FF8A4C', '#FF477E', '#9D4EDD']],  // orange → pink → purple
  ['Sunrise', ['#FFE08A', '#FF6FA0']],            // amber ↔ pink
  ['Dawn', ['#FFD27F', '#A78BFA']],               // peach ↔ violet
  ['Ember', ['#FFC24B', '#E0245E']],              // amber ↔ crimson
  ['Volcano', ['#FFD93D', '#FF6B3D', '#C9184A']], // yellow → orange → red
  ['Coral', ['#FF9E6D', '#FF477E']],              // peach ↔ rose
  ['Twilight', ['#FFB07C', '#A06CF0', '#3A4ED8']],// peach → purple → blue
  ['Bubblegum', ['#FF8AD8', '#A06CF0']],          // pink ↔ purple
  ['Berry', ['#FF6FA0', '#6A0572']],              // pink ↔ plum
  ['Grape', ['#B07CF0', '#4A2F91']],              // violet ↔ deep purple
  ['Opal', ['#CFF6E0', '#A3D0FF', '#E0B3FF']],    // iridescent pastel
  ['Prism', ['#FF6F91', '#FFD36E', '#34E0A0', '#3A8FE0'], 'Rare'], // 4-color
];

// Free default + showcase multi-color gradients + distinct solids + animated
// Aurora. Pro unlocks all. Gradients lead so the variety shows immediately.
export const ASC_SKINS = [
  { id: 'drift', name: 'Drift', colors: ['#FFFFFF', '#D6ECFF'], c1: '#FFFFFF', c2: '#D6ECFF', core: '#FFFFFF', glow: '#BFE3FF', trail: '#CFE8FF', price: 0, tag: 'Default' },
  ...GRADIENT_SPECS.map(makeGrad),
  ...SOLID_SPECS.map(makeSkin),
  { id: 'aurora', name: 'Aurora', colors: ['#9CFFC9', '#7FD8E6', '#5AA9F2'], c1: '#9CFFC9', c2: '#5AA9F2', core: '#E8FFF2', glow: '#7FD8E6', trail: '#B6FFE0', price: 0, tag: 'Rare', rainbow: true },
];

export function skinById(id) {
  return ASC_SKINS.find((s) => s.id === id) || ASC_SKINS[0];
}

// Typography — Google Fonts loaded in App.js. These family names match the
// weights registered there; if a font fails to load the OS falls back.
export const FONT = {
  display: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  sans: 'PlusJakartaSans_500Medium',
  sansSemi: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  sansExtra: 'PlusJakartaSans_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',
};

export { mixHex };
