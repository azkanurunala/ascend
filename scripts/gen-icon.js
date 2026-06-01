// Generates a 1024x1024 placeholder app icon (pure Node, no deps).
// Dark background with an upward chevron gradient — fits "Ascend".
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const S = 1024;

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

// Background (dark) and accent gradient (indigo -> cyan)
const BG = [0x0a, 0x0a, 0x0f];
const C1 = [0x6d, 0x5d, 0xfc];
const C2 = [0x00, 0xd4, 0xff];

// Distance from a point to a line segment (for chevron stroke thickness)
function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Two upward chevrons (stacked) centered
const cx = S / 2;
const thick = 70;
function chevrons() {
  // chevron defined by apex + two arms; we stack two for an "ascend" look
  const arms = [];
  const apexYs = [380, 600];
  const spread = 240;
  const drop = 170;
  for (const ay of apexYs) {
    arms.push([cx - spread, ay + drop, cx, ay]); // left arm
    arms.push([cx + spread, ay + drop, cx, ay]); // right arm
  }
  return arms;
}
const ARMS = chevrons();

const raw = Buffer.alloc(S * (1 + S * 3));
for (let y = 0; y < S; y++) {
  const rowStart = y * (1 + S * 3);
  raw[rowStart] = 0; // filter byte: none
  for (let x = 0; x < S; x++) {
    let minD = Infinity;
    for (const a of ARMS) {
      const d = distToSeg(x, y, a[0], a[1], a[2], a[3]);
      if (d < minD) minD = d;
    }
    let r, g, b;
    if (minD <= thick) {
      // inside chevron: gradient top->bottom
      const t = y / S;
      r = lerp(C1[0], C2[0], t);
      g = lerp(C1[1], C2[1], t);
      b = lerp(C1[2], C2[2], t);
      // soft antialias edge
      const edge = thick - minD;
      if (edge < 3) {
        const f = edge / 3;
        r = lerp(BG[0], r, f); g = lerp(BG[1], g, f); b = lerp(BG[2], b, f);
      }
    } else {
      r = BG[0]; g = BG[1]; b = BG[2];
    }
    const o = rowStart + 1 + x * 3;
    raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
  }
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// CRC32
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

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 2;   // color type RGB
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const idat = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'icon.png');
fs.writeFileSync(out, png);
console.log('Wrote', out, png.length, 'bytes');
