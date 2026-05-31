// Ascend — glassmorphism theme: palette, altitude sky bands, cosmetics, glass helpers.
// Fonts: Space Grotesk (display), Plus Jakarta Sans (UI), Geist Mono (numbers).

const ASC = {
  // ink / glass over the sky
  ink:      "#0F1A2B",
  ink2:     "rgba(15,26,43,0.62)",
  ink3:     "rgba(15,26,43,0.40)",
  inkOn:    "#F4F8FF",          // ink for use on dark/space sky
  inkOn2:   "rgba(244,248,255,0.66)",
  glass:    "rgba(255,255,255,0.30)",
  glassHi:  "rgba(255,255,255,0.46)",
  glassDk:  "rgba(255,255,255,0.16)",
  hair:     "rgba(255,255,255,0.55)",
  hairDk:   "rgba(255,255,255,0.18)",
  shadow:   "rgba(20,40,80,0.22)",
  // accents
  gold:     "#F2B33D",
  mint:     "#4FE0B0",
  sky:      "#5AA9F2",
  violet:   "#A98CF5",
  rose:     "#F2719B",
  danger:   "#FF6B5E",
};

// Altitude bands — each anchor is [skyTop, skyBottom, fog, isDark].
// We interpolate between anchors by altitude for a continuous climb.
const ASC_BANDS = [
  { at: 0,    top: "#BFE3D0", bot: "#EAF3E4", fog: "#FFFFFF", dark: false, name: "Meadow" },
  { at: 400,  top: "#7FC8E8", bot: "#CDEBF0", fog: "#EAF6FB", dark: false, name: "Open Sky" },
  { at: 1200, top: "#4E93D8", bot: "#9FD0EE", fog: "#DCEBFB", dark: false, name: "High Sky" },
  { at: 2600, top: "#3257A8", bot: "#6E8FD6", fog: "#C6D3F0", dark: false, name: "Stratosphere" },
  { at: 4200, top: "#2B2C6B", bot: "#4B4AA0", fog: "#9C97D8", dark: true,  name: "Mesosphere" },
  { at: 6200, top: "#172048", bot: "#3A2F74", fog: "#6E5CB0", dark: true,  name: "Aurora" },
  { at: 8500, top: "#070A1B", bot: "#161A3A", fog: "#2A2F5C", dark: true,  name: "The Edge" },
  { at: 12000,top: "#02030A", bot: "#080A1C", fog: "#141738", dark: true,  name: "Orbit" },
];

function _hexToRgb(h) {
  const x = h.replace("#", "");
  return [parseInt(x.slice(0,2),16), parseInt(x.slice(2,4),16), parseInt(x.slice(4,6),16)];
}
function _mix(a, b, t) {
  const A = _hexToRgb(a), B = _hexToRgb(b);
  const r = Math.round(A[0]+(B[0]-A[0])*t), g = Math.round(A[1]+(B[1]-A[1])*t), bl = Math.round(A[2]+(B[2]-A[2])*t);
  return `rgb(${r},${g},${bl})`;
}
function _mixHex(a, b, t) {
  const A = _hexToRgb(a), B = _hexToRgb(b);
  const to = (n) => n.toString(16).padStart(2,"0");
  return "#" + to(Math.round(A[0]+(B[0]-A[0])*t)) + to(Math.round(A[1]+(B[1]-A[1])*t)) + to(Math.round(A[2]+(B[2]-A[2])*t));
}

// Resolve sky for a given altitude → { top, bot, fog, dark, name }
function skyAt(alt) {
  const B = ASC_BANDS;
  if (alt <= B[0].at) return { ...B[0] };
  if (alt >= B[B.length-1].at) return { ...B[B.length-1] };
  let i = 0;
  while (i < B.length-1 && B[i+1].at <= alt) i++;
  const a = B[i], b = B[i+1];
  const t = (alt - a.at) / (b.at - a.at);
  return {
    top: _mixHex(a.top, b.top, t),
    bot: _mixHex(a.bot, b.bot, t),
    fog: _mixHex(a.fog, b.fog, t),
    dark: t > 0.5 ? b.dark : a.dark,
    name: t > 0.5 ? b.name : a.name,
  };
}

// Ball cosmetics. core = orb fill, glow = halo color, trail = particle color,
// price 0 = owned by default. ring = optional accent stroke.
const ASC_SKINS = [
  { id: "drift",   name: "Drift",     core: "#FFFFFF", glow: "#BFE3FF", trail: "#CFE8FF", price: 0,    tag: "Default" },
  { id: "ember",   name: "Ember",     core: "#FFB85C", glow: "#FF7A3D", trail: "#FFC36B", price: 0.99, tag: "Warm"   },
  { id: "neon",    name: "Neon",      core: "#7CFFE0", glow: "#1BE3C0", trail: "#9BFFEC", price: 0.99, tag: "Bright" },
  { id: "amethyst",name: "Amethyst",  core: "#C9AEFF", glow: "#8C5CF5", trail: "#D7C2FF", price: 1.99, tag: "Glow"   },
  { id: "rose",    name: "Rosegold",  core: "#FFC7D6", glow: "#F2719B", trail: "#FFD7E2", price: 1.99, tag: "Soft"   },
  { id: "aurora",  name: "Aurora",    core: "#9CFFC9", glow: "#5AA9F2", trail: "#B6FFE0", price: 2.99, tag: "Rare", rainbow: true },
];

// Geist mono is data; Space Grotesk display; Plus Jakarta UI.
(function () {
  if (typeof document === "undefined" || document.getElementById("asc-fonts")) return;
  const link = document.createElement("link");
  link.id = "asc-fonts"; link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(link);

  const s = document.createElement("style");
  s.id = "asc-styles";
  s.textContent = `
    .asc-display { font-family:'Space Grotesk','Plus Jakarta Sans',system-ui,sans-serif; letter-spacing:-0.03em; }
    .asc-sans    { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
    .asc-mono    { font-family:'Geist Mono','JetBrains Mono',monospace; }
    .asc-num     { font-variant-numeric:tabular-nums; font-feature-settings:'tnum'; }
    .asc-eyebrow { font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:2.6px; text-transform:uppercase; font-weight:500; }
    .asc-app, .asc-app * { scrollbar-width:none; -ms-overflow-style:none; }
    .asc-app::-webkit-scrollbar, .asc-app *::-webkit-scrollbar { width:0; height:0; display:none; }
    .asc-glass { backdrop-filter:blur(20px) saturate(150%); -webkit-backdrop-filter:blur(20px) saturate(150%); }
    @keyframes ascFloat { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-7px);} }
    @keyframes ascPulse { 0%,100%{ opacity:.55; transform:scale(1);} 50%{ opacity:1; transform:scale(1.06);} }
    @keyframes ascPop   { 0%{ transform:scale(.86); opacity:0;} 60%{ transform:scale(1.04);} 100%{ transform:scale(1); opacity:1;} }
    @keyframes ascRise  { from{ transform:translateY(14px); opacity:0;} to{ transform:translateY(0); opacity:1;} }
    @keyframes ascSpinHue { to { filter:hue-rotate(360deg);} }
    @keyframes ascShine { 0%{ transform:translateX(-130%);} 100%{ transform:translateX(130%);} }
  `;
  document.head.appendChild(s);
})();

// ── Glass surface. tone: 'reg' | 'hi' | 'dk'. dark=true uses light hairlines.
function Glass({ tone = "reg", dark = false, radius = 20, pad = 16, style = {}, className = "", children, onClick }) {
  const bg = tone === "hi" ? (dark ? "rgba(255,255,255,0.12)" : ASC.glassHi)
           : tone === "dk" ? (dark ? "rgba(255,255,255,0.05)" : ASC.glassDk)
           : (dark ? "rgba(255,255,255,0.08)" : ASC.glass);
  return (
    <div onClick={onClick} className={"asc-glass " + className} style={{
      background: bg,
      border: `1px solid ${dark ? ASC.hairDk : ASC.hair}`,
      borderRadius: radius,
      boxShadow: `0 1px 0 ${dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)"} inset, 0 10px 30px ${ASC.shadow}`,
      padding: pad,
      ...style,
    }}>{children}</div>
  );
}

// Visual orb (DOM) — used in menus/cosmetics. size in px.
function Orb({ skin, size = 56, animate = true, style = {} }) {
  const s = skin || ASC_SKINS[0];
  return (
    <div style={{ position:"relative", width:size, height:size, ...style }}>
      <div style={{
        position:"absolute", inset:-size*0.34, borderRadius:"50%",
        background:`radial-gradient(circle, ${s.glow}99 0%, ${s.glow}00 68%)`,
        animation: animate ? "ascPulse 2.6s ease-in-out infinite" : "none",
        filter: s.rainbow ? "saturate(1.3)" : "none",
      }} />
      <div style={{
        position:"absolute", inset:0, borderRadius:"50%",
        background:`radial-gradient(circle at 32% 28%, #ffffff, ${s.core} 46%, ${_mixHex(s.core, s.glow, 0.55)} 100%)`,
        boxShadow:`inset -3px -4px 8px rgba(0,0,0,0.18), inset 3px 4px 8px rgba(255,255,255,0.7), 0 6px 16px ${s.glow}66`,
        animation: (s.rainbow && animate) ? "ascSpinHue 6s linear infinite" : "none",
      }} />
      <div style={{
        position:"absolute", left:size*0.24, top:size*0.18, width:size*0.26, height:size*0.2,
        borderRadius:"50%", background:"rgba(255,255,255,0.9)", filter:"blur(1px)",
      }} />
    </div>
  );
}

Object.assign(window, {
  ASC, ASC_BANDS, ASC_SKINS, skyAt, ascMix: _mix, ascMixHex: _mixHex, Glass, Orb,
});
