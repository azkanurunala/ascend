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

// Build an rgba() string from a hex color and an alpha (0–1). Used for Skia,
// which is happier with rgba() strings than 8-digit hex.
export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
