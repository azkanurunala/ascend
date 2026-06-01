// Generates the Ascend app icon (1024x1024, pure Node, no deps, no alpha).
//
// Brand: a glowing orb ascending through a night sky toward orbit, leaving a
// light trail — echoing the in-game orb (halo + trail) and the dark sky bands
// from src/theme.js. Built with additive light compositing for a soft bloom.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const S = 1024;

// ---- helpers ----
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

// ---- palette (from src/theme.js) ----
const BG_TOP = [4, 5, 12];      // deep orbit / space
const BG_BOT = [14, 23, 54];    // high stratosphere indigo
const SKY_GLOW = [30, 58, 110]; // radial depth behind the orb
const HALO = [90, 169, 242];    // ASC.sky #5AA9F2
const TRAIL = [155, 212, 255];  // drift trail blue
const ORB_CORE = [246, 251, 255];
const ORB_EDGE = [148, 201, 255];
const STAR = [220, 235, 255];

// ---- geometry ----
const cx = S / 2;
const orbX = 512, orbY = 432, orbR = 150;
const haloSigma = 150;
const trailTop = orbY + 6, trailBot = 854;

// Deterministic stars (no Math.random — kept reproducible). [x, y, bright, r]
const STARS = [
  [150, 150, 0.7, 2.6], [880, 120, 0.55, 2.2], [240, 300, 0.4, 1.8],
  [820, 360, 0.6, 2.4], [120, 560, 0.45, 2.0], [930, 600, 0.5, 2.2],
  [330, 90, 0.5, 2.0], [680, 70, 0.42, 1.8], [70, 380, 0.38, 1.7],
  [960, 250, 0.46, 2.0], [200, 720, 0.34, 1.6], [870, 800, 0.4, 1.8],
];

function addLight(acc, color, amount) {
  acc[0] += color[0] * amount;
  acc[1] += color[1] * amount;
  acc[2] += color[2] * amount;
}

const raw = Buffer.alloc(S * (1 + S * 3));
for (let y = 0; y < S; y++) {
  const rowStart = y * (1 + S * 3);
  raw[rowStart] = 0; // PNG filter: none
  for (let x = 0; x < S; x++) {
    // base background: vertical gradient + corner vignette
    const vt = y / S;
    let col = mix(BG_TOP, BG_BOT, Math.pow(vt, 1.1));
    const dcx = (x - cx) / (S / 2);
    const dcy = (y - S / 2) / (S / 2);
    const vig = 1 - 0.4 * clamp(dcx * dcx + dcy * dcy, 0, 1);
    col = [col[0] * vig, col[1] * vig, col[2] * vig];

    const acc = [col[0], col[1], col[2]];

    // distance to orb center
    const ox = x - orbX, oy = y - orbY;
    const d = Math.sqrt(ox * ox + oy * oy);

    // radial sky glow behind the orb (depth)
    addLight(acc, SKY_GLOW, 0.55 * Math.exp(-(d * d) / (2 * 230 * 230)));

    // orb bloom / halo
    const halo = Math.exp(-(d * d) / (2 * haloSigma * haloSigma));
    addLight(acc, HALO, 1.15 * halo);

    // ascent trail below the orb (tapering, soft horizontal gaussian, fades down)
    if (y > trailTop) {
      const along = clamp((y - trailTop) / (trailBot - trailTop), 0, 1);
      const w = lerp(58, 12, along);          // width narrows downward
      const dx = x - cx;
      const hf = Math.exp(-(dx * dx) / (2 * (w * 0.5) * (w * 0.5)));
      const vfade = Math.pow(1 - along, 1.35);
      addLight(acc, TRAIL, 0.95 * hf * vfade);
    }

    // stars (subtle)
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i];
      const sx = x - s[0], sy = y - s[1];
      const sd2 = sx * sx + sy * sy;
      addLight(acc, STAR, s[2] * Math.exp(-sd2 / (2 * s[3] * s[3])));
    }

    // orb body (opaque, with core gradient + top-left specular)
    if (d < orbR + 3) {
      const t = clamp(d / orbR, 0, 1);
      let orbCol = mix(ORB_CORE, ORB_EDGE, smoothstep(0, 1, t));
      // specular highlight, upper-left
      const hx = x - (orbX - 48), hy = y - (orbY - 52);
      const spec = Math.exp(-(hx * hx + hy * hy) / (2 * 60 * 60));
      orbCol = [
        clamp(orbCol[0] + 36 * spec, 0, 255),
        clamp(orbCol[1] + 30 * spec, 0, 255),
        clamp(orbCol[2] + 22 * spec, 0, 255),
      ];
      const cov = 1 - smoothstep(orbR - 2, orbR + 2, d); // AA edge
      acc[0] = lerp(acc[0], orbCol[0], cov);
      acc[1] = lerp(acc[1], orbCol[1], cov);
      acc[2] = lerp(acc[2], orbCol[2], cov);
    }

    const o = rowStart + 1 + x * 3;
    raw[o] = clamp(Math.round(acc[0]), 0, 255);
    raw[o + 1] = clamp(Math.round(acc[1]), 0, 255);
    raw[o + 2] = clamp(Math.round(acc[2]), 0, 255);
  }
}

// ---- PNG encode (RGB, no alpha) ----
const crcTable = (() => {
  const t = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 2;  // color type RGB
const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'icon.png');
fs.writeFileSync(out, png);
console.log('Wrote', out, png.length, 'bytes');
