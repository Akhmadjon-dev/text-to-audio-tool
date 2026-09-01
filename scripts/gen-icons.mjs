// Dependency-free PNG icon generator for the PWA manifest.
// Draws a simple brand-colored "book + soundwave" glyph so the app is
// installable without pulling in an image toolchain. Replace with polished
// artwork later (see PLAN.md).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/icons');
mkdirSync(OUT, { recursive: true });

const BG = [15, 118, 110, 255]; // #0f766e brand-700
const PAGE = [236, 254, 255, 255]; // #ecfeff
const WAVE = [94, 234, 212, 255]; // #5eead4

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rows with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function set(px, size, x, y, c) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = c[3];
}

function draw(size) {
  const px = Buffer.alloc(size * size * 4);
  // background
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = BG[0];
    px[i * 4 + 1] = BG[1];
    px[i * 4 + 2] = BG[2];
    px[i * 4 + 3] = BG[3];
  }
  const s = size / 512; // scale from a 512 design grid
  // book page: a rounded-ish filled rectangle
  const bx0 = Math.round(150 * s),
    bx1 = Math.round(300 * s),
    by0 = Math.round(150 * s),
    by1 = Math.round(370 * s);
  for (let y = by0; y < by1; y++) for (let x = bx0; x < bx1; x++) set(px, size, x, y, PAGE);
  // spine line
  const spineX = Math.round(225 * s);
  for (let y = by0; y < by1; y++)
    for (let x = spineX - Math.round(3 * s); x <= spineX + Math.round(3 * s); x++)
      set(px, size, x, y, BG);
  // sound waves: two vertical arcs approximated by short vertical bars
  const cx = Math.round(360 * s);
  const cy = Math.round(260 * s);
  for (let r = Math.round(30 * s); r <= Math.round(90 * s); r += Math.round(30 * s)) {
    for (let y = -r; y <= r; y++) {
      const x = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
      for (let t = 0; t < Math.round(8 * s); t++) set(px, size, cx + x - t, cy + y, WAVE);
    }
  }
  return px;
}

for (const size of [192, 512]) {
  writeFileSync(resolve(OUT, `icon-${size}.png`), encodePNG(size, draw(size)));
}
// maskable = full-bleed (same art; background already fills the safe zone)
writeFileSync(resolve(OUT, 'icon-maskable-512.png'), encodePNG(512, draw(512)));

console.log('Generated icon-192.png, icon-512.png, icon-maskable-512.png');
