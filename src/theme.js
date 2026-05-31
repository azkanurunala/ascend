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

// Ball cosmetics. core = orb fill, glow = halo color, trail = particle color,
// price 0 = owned by default. rainbow = animated hue.
export const ASC_SKINS = [
  { id: 'drift', name: 'Drift', core: '#FFFFFF', glow: '#BFE3FF', trail: '#CFE8FF', price: 0, tag: 'Default' },
  { id: 'ember', name: 'Ember', core: '#FFB85C', glow: '#FF7A3D', trail: '#FFC36B', price: 0.99, tag: 'Warm' },
  { id: 'neon', name: 'Neon', core: '#7CFFE0', glow: '#1BE3C0', trail: '#9BFFEC', price: 0.99, tag: 'Bright' },
  { id: 'amethyst', name: 'Amethyst', core: '#C9AEFF', glow: '#8C5CF5', trail: '#D7C2FF', price: 1.99, tag: 'Glow' },
  { id: 'rose', name: 'Rosegold', core: '#FFC7D6', glow: '#F2719B', trail: '#FFD7E2', price: 1.99, tag: 'Soft' },
  { id: 'aurora', name: 'Aurora', core: '#9CFFC9', glow: '#5AA9F2', trail: '#B6FFE0', price: 2.99, tag: 'Rare', rainbow: true },
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
