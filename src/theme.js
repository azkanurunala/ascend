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

// 48 hand-tuned, distinct orbs: [name, hue, sat, light, hueShift, tag].
// hueShift ≠ 0 makes a two-color gradient orb; the bigger the shift the more the
// two colors differ. Bold = saturated, Soft = pastel, Mix = strong dual-color.
const SKIN_SPECS = [
  // bold single-color
  ['Crimson', 352, 0.9, 0.5, 0, 'Bold'], ['Ruby', 358, 0.9, 0.48, 0, 'Bold'],
  ['Magenta', 315, 0.95, 0.55, 0, 'Bold'], ['Fuchsia', 310, 1.0, 0.55, 0, 'Neon'],
  ['Violet', 276, 0.85, 0.6, 0, 'Bold'], ['Cobalt', 225, 0.95, 0.52, 0, 'Bold'],
  ['Azure', 205, 0.88, 0.58, 0, 'Bold'], ['Cyan', 185, 0.95, 0.56, 0, 'Neon'],
  ['Teal', 176, 0.82, 0.48, 0, 'Jewel'], ['Emerald', 145, 0.9, 0.44, 0, 'Bold'],
  ['Jade', 150, 0.72, 0.5, 0, 'Jewel'], ['Lime', 92, 0.92, 0.58, 0, 'Neon'],
  ['Gold', 48, 0.95, 0.55, 0, 'Bold'], ['Marigold', 45, 0.95, 0.6, 0, 'Bold'],
  ['Tangerine', 26, 0.95, 0.56, 0, 'Bold'], ['Indigo', 244, 0.85, 0.5, 0, 'Jewel'],
  // soft pastels
  ['Blush', 345, 0.5, 0.8, 16, 'Soft'], ['Rose', 335, 0.68, 0.7, 0, 'Soft'],
  ['Lavender', 266, 0.45, 0.78, 10, 'Soft'], ['Periwinkle', 238, 0.5, 0.74, 20, 'Soft'],
  ['Ice', 200, 0.38, 0.84, 0, 'Soft'], ['Glacier', 195, 0.42, 0.82, 0, 'Soft'],
  ['Seafoam', 160, 0.5, 0.76, 0, 'Soft'], ['Mint', 152, 0.55, 0.76, 0, 'Soft'],
  ['Sky', 200, 0.62, 0.7, 0, 'Soft'], ['Peach', 22, 0.55, 0.78, 12, 'Soft'],
  ['Honey', 40, 0.68, 0.66, 0, 'Soft'], ['Amber', 42, 0.92, 0.55, 10, 'Bold'],
  ['Coral', 10, 0.85, 0.65, 16, 'Soft'], ['Lilac', 285, 0.4, 0.8, -12, 'Soft'],
  // bold two-color gradients
  ['Tide', 210, 0.85, 0.55, -72, 'Mix'], ['Reef', 190, 0.85, 0.54, -46, 'Mix'],
  ['Tropic', 150, 0.85, 0.52, 40, 'Mix'], ['Lagoon', 205, 0.8, 0.55, -42, 'Mix'],
  ['Mojito', 100, 0.85, 0.55, 52, 'Mix'], ['Sunset', 340, 0.95, 0.6, 44, 'Mix'],
  ['Phoenix', 12, 1.0, 0.55, 42, 'Mix'], ['Mango', 40, 0.92, 0.6, -26, 'Mix'],
  ['Citrus', 52, 0.9, 0.58, -28, 'Mix'], ['Nebula', 280, 0.88, 0.5, -70, 'Mix'],
  ['Galaxy', 250, 0.9, 0.46, 62, 'Mix'], ['Twilight', 268, 0.72, 0.5, -58, 'Mix'],
  ['Cosmos', 232, 0.82, 0.5, -46, 'Mix'], ['Iris', 285, 0.8, 0.56, 64, 'Mix'],
  ['Orchid', 300, 0.7, 0.62, -44, 'Mix'], ['Berry', 322, 0.8, 0.52, -44, 'Mix'],
  ['Spectra', 190, 0.85, 0.58, 86, 'Mix'], ['Plum', 290, 0.72, 0.46, -24, 'Jewel'],
];

// 50 orbs: free default + 48 distinct + the animated Aurora. Pro unlocks all.
export const ASC_SKINS = [
  { id: 'drift', name: 'Drift', c1: '#FFFFFF', c2: '#D6ECFF', core: '#FFFFFF', glow: '#BFE3FF', trail: '#CFE8FF', price: 0, tag: 'Default' },
  ...SKIN_SPECS.map(makeSkin),
  { id: 'aurora', name: 'Aurora', c1: '#9CFFC9', c2: '#5AA9F2', core: '#E8FFF2', glow: '#7FD8E6', trail: '#B6FFE0', price: 0, tag: 'Rare', rainbow: true },
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
