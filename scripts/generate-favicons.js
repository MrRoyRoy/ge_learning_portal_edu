#!/usr/bin/env node
/**
 * generate-favicons.js — builds the Archie favicon set from the pixel sprite sheet.
 *
 * Usage: npm run favicons   (needs the `sharp` devDependency)
 *
 * Pipeline:
 *  1. Crop one frame (FRAME_INDEX) out of game/archie.png using the frame size in game/manifest.json.
 *  2. Trim transparent edges so the raven fills the icon.
 *  3. Add a 1-source-pixel parchment OUTLINE around the silhouette (alpha dilation, see addOutline).
 *     Browser favicons sit on a TRANSPARENT background; the raven is near-black, so without
 *     the outline it would vanish on dark tab strips.
 *  4. For each target size, scale the outlined sprite into a transparent square.
 *     - Pixel art is scaled with nearest-neighbour by the largest INTEGER factor that fits
 *       the safe area, so pixels stay crisp. Below 2x (the 16/32px icons) an integer
 *       scale is impossible, so lanczos is used to keep the silhouette readable.
 *     - apple-touch-icon is the exception: iOS paints transparent pixels black, so it keeps
 *       a full-bleed parchment tile (iOS applies its own rounded mask).
 *  5. Write PNGs and pack 16/32/48 PNGs into favicon.ico. An ICO file may embed PNG
 *     payloads directly: a 6-byte ICONDIR, one 16-byte ICONDIRENTRY per image,
 *     then the raw PNG bytes.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const FRAME_INDEX = 3;                         // compact glide pose, reads best at tiny sizes
const OUTLINE = [244, 228, 188];               // parchment #F4E4BC, matches the news scroll
const TILE = '#FFF1D0';                        // apple-touch background

/** Extract and trim the chosen sprite frame → raw RGBA { data, w, h }. */
const loadFrame = async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/manifest.json'), 'utf8'));
  const { file, frameW, frameH } = manifest.archie;
  // Two separate pipelines: within one pipeline sharp applies trim() before extract().
  const cropped = await sharp(path.join(ROOT, 'game', file))
    .extract({ left: frameW * FRAME_INDEX, top: 0, width: frameW, height: frameH })
    .png()
    .toBuffer();
  const { data, info } = await sharp(await sharp(cropped).trim().png().toBuffer())
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};

/**
 * addOutline(frame) → PNG buffer, 2px larger in each dimension.
 * Alpha dilation with an 8-neighbourhood: every transparent pixel touching an opaque one
 * becomes an opaque OUTLINE pixel. Original pixels are copied on top unchanged.
 */
const addOutline = ({ data, w, h }) => {
  const W = w + 2, H = h + 2;
  const out = Buffer.alloc(W * H * 4);
  const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 127;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, sx = x - 1, sy = y - 1;
      if (opaque(sx, sy)) {
        data.copy(out, o, (sy * w + sx) * 4, (sy * w + sx) * 4 + 4);
        out[o + 3] = 255;
        continue;
      }
      let touch = false;
      for (let dy = -1; dy <= 1 && !touch; dy++) for (let dx = -1; dx <= 1; dx++) if (opaque(sx + dx, sy + dy)) { touch = true; break; }
      if (touch) { out[o] = OUTLINE[0]; out[o + 1] = OUTLINE[1]; out[o + 2] = OUTLINE[2]; out[o + 3] = 255; }
    }
  }
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer().then((buf) => ({ buf, w: W, h: H }));
};

/** Render one icon of `size` px; the sprite occupies at most `safe` of the square. */
const renderIcon = async (sprite, size, { tile = false, safe = 0.96 } = {}) => {
  const box = Math.floor(size * safe);
  const fit = Math.min(box / sprite.w, box / sprite.h);
  const scale = fit >= 2 ? Math.floor(fit) : fit;           // integer scale when possible
  const w = Math.max(1, Math.round(sprite.w * scale));
  const h = Math.max(1, Math.round(sprite.h * scale));
  const raven = await sharp(sprite.buf)
    .resize(w, h, { kernel: fit >= 2 ? 'nearest' : 'lanczos3' })
    .toBuffer();
  const background = tile ? TILE : { r: 0, g: 0, b: 0, alpha: 0 };
  return sharp({ create: { width: size, height: size, channels: 4, background } })
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
  const sprite = await addOutline(await loadFrame());
  const out = (name, buf) => {
    fs.writeFileSync(path.join(ROOT, name), buf);
    console.log('wrote', name, buf.length, 'bytes');
  };
  const [p16, p32, p48] = await Promise.all([16, 32, 48].map((s) => renderIcon(sprite, s)));
  out('favicon-32x32.png', p32);
  out('favicon.png', await renderIcon(sprite, 64));
  out('favicon-192x192.png', await renderIcon(sprite, 192));
  out('favicon-512x512.png', await renderIcon(sprite, 512));
  out('apple-touch-icon.png', await renderIcon(sprite, 180, { tile: true, safe: 0.78 }));
  out('favicon.ico', packIco([{ size: 16, png: p16 }, { size: 32, png: p32 }, { size: 48, png: p48 }]));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
