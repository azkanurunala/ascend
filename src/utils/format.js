// Number + time formatting helpers (Hermes-safe; no Intl grouping reliance).

export function fmtNum(n) {
  return Math.floor(n || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function fmtTime(secs) {
  const s = Math.floor(secs || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function fmtPrice(p) {
  return `$${p.toFixed(2)}`;
}
