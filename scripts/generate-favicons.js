#!/usr/bin/env node
/**
 * generate-favicons.js — builds the Archie favicon set from the pixel sprite sheet.
 *
 * Usage: npm run favicons   (needs the `sharp` devDependency)
 *
 * Pipeline:
 *  1. Crop one frame (FRAME_INDEX) out of game/archie.png using the frame size in game/manifest.json.
 *  2. Trim transparent edges so the raven fills the icon.
 *  3. For each target size, composite the raven onto a rounded "parchment" tile.
 *     The raven is near-black, so a warm light tile keeps it legible on both
 *     dark and light browser tab strips.
 *     - Pixel art is scaled with nearest-neighbour by the largest INTEGER factor that fits
 *       the safe area, so pixels stay crisp. Below 2x (the 16px icon) an integer
 *       scale is impossible, so lanczos is used to keep the silhouette readable.
 *  4. Write PNGs and pack 16/32/48 PNGs into favicon.ico. An ICO file may embed PNG
 *     payloads directly: a 6-byte ICONDIR, one 16-byte ICONDIRENTRY per image,
 *     then the raw PNG bytes.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const FRAME_INDEX = 3;          // compact glide pose, reads best at tiny sizes
const TILE = '#FFF1D0';         // parchment, matches the news scroll
const EDGE = '#C9A35B';         // thin gold rim

/** Rounded-square tile SVG. `rounded=false` gives a full-bleed tile (iOS applies its own mask). */
const tileSvg = (size, rounded) => {
  const r = rounded ? Math.round(size * 0.22) : 0;
  const sw = Math.max(1, Math.round(size / 32));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect x="${sw / 2}" y="${sw / 2}" width="${size - sw}" height="${size - sw}" rx="${r}" ry="${r}"
        fill="${TILE}" stroke="${rounded ? EDGE : TILE}" stroke-width="${sw}"/></svg>`
  );
};

/** Extract and trim the chosen sprite frame → { buf, w, h }. */
const loadFrame = async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/manifest.json'), 'utf8'));
  const { file, frameW, frameH } = manifest.archie;
  // Two separate pipelines: within one pipeline sharp applies trim() before extract().
  const cropped = await sharp(path.join(ROOT, 'game', file))
    .extract({ left: frameW * FRAME_INDEX, top: 0, width: frameW, height: frameH })
    .png()
    .toBuffer();
  const { data, info } = await sharp(cropped).trim().png().toBuffer({ resolveWithObject: true });
  return { buf: data, w: info.width, h: info.height };
};

/** Render one icon of `size` px; the raven occupies at most `safe` of the tile. */
const renderIcon = async (frame, size, { rounded = true, safe = 0.84 } = {}) => {
  const box = Math.floor(size * safe);
  const fit = Math.min(box / frame.w, box / frame.h);
  const scale = fit >= 2 ? Math.floor(fit) : fit;           // integer scale when possible
  const w = Math.max(1, Math.round(frame.w * scale));
  const h = Math.max(1, Math.round(frame.h * scale));
  const raven = await sharp(frame.buf)
    .resize(w, h, { kernel: fit >= 2 ? 'nearest' : 'lanczos3' })
    .toBuffer();
  return sharp(tileSvg(size, rounded))
    .composite([{ input: raven, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toBuffer();
};

/** Pack PNG buffers into an ICO container (see header comment for layout). */
const packIco = (entries) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);              // reserved
  header.writeUInt16LE(1, 2);              // type 1 = icon
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + 16 * entries.length;
  const dir = entries.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2);                      // palette colours
    e.writeUInt8(0, 3);                      // reserved
    e.writeUInt16LE(1, 4);                   // colour planes
    e.writeUInt16LE(32, 6);                  // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...dir, ...entries.map((x) => x.png)]);
};

(async () => {
  const frame = await loadFrame();
  const out = (name, buf) => {
    fs.writeFileSync(path.join(ROOT, name), buf);
    console.log('wrote', name, buf.length, 'bytes');
  };
  const [p16, p32, p48] = await Promise.all([16, 32, 48].map((s) => renderIcon(frame, s, { safe: 0.92 })));
  out('favicon-32x32.png', p32);
  out('favicon.png', await renderIcon(frame, 64));
  out('favicon-192x192.png', await renderIcon(frame, 192));
  out('favicon-512x512.png', await renderIcon(frame, 512));
  out('apple-touch-icon.png', await renderIcon(frame, 180, { rounded: false, safe: 0.78 }));
  out('favicon.ico', packIco([{ size: 16, png: p16 }, { size: 32, png: p32 }, { size: 48, png: p48 }]));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
