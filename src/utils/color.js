// ============ COLOR UTILITIES ============
// Hex parsing + interpolation, ported from ascend-theme.jsx (_hexToRgb / _mix / _mixHex).

export function hexToRgb(h) {
  const x = h.replace('#', '');
  return [
    parseInt(x.slice(0, 2), 16),
    parseInt(x.slice(2, 4), 16),
    parseInt(x.slice(4, 6), 16),
  ];
}

// Linear interpolate two hex colors → "rgb(r,g,b)"
export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// Linear interpolate two hex colors → "#rrggbb"
export function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const to = (n) => Math.round(n).toString(16).padStart(2, '0');
  return (
    '#' +
    to(A[0] + (B[0] - A[0]) * t) +
    to(A[1] + (B[1] - A[1]) * t) +
    to(A[2] + (B[2] - A[2]) * t)
  );
}

// Relative luminance (0 = black, 1 = white) of a hex color — sRGB/WCAG.
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

// Pick dark vs light text for legibility over a set of background colors.
// Bright (near-white) backgrounds → dark ink; otherwise → white.
export function readableInk(colors, dark = '#0F1A2B', light = '#FFFFFF') {
  const list = Array.isArray(colors) ? colors : [colors];
  const avg = list.reduce((a, c) => a + luminance(c), 0) / list.length;
  return avg > 0.7 ? dark : light;
}

// Build an rgba() string from a hex color and an alpha (0–1). Used for Skia,
// which is happier with rgba() strings than 8-digit hex.
export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
