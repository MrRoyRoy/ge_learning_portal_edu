#!/usr/bin/env node
/* scripts/generate-game-assets.js - Pixel-art assets for the "Quest Run" side-scroller strip
 *
 * Usage:
 *   npm run game-assets                              # generate missing raw images, (re)process everything
 *   npm run game-assets -- --only=hero_wizard,archie # restrict to some assets
 *   npm run game-assets -- --force                   # regenerate the raw model output even if one exists
 *   npm run game-assets -- --no-gen                  # never call Vertex; only re-process existing raw images
 *   npm run game-assets -- --contact=out.png         # also write a 4x contact sheet of the processed assets
 *   npm run game-assets -- --raw-contact=raw.png     # also write a contact sheet of the raw model outputs
 *
 * Raw model outputs are kept OUTSIDE the repo (GAME_RAW_DIR, default: the agent scratch dir) as
 *   <name>.v<N>.png (every attempt) and <name>.png (the attempt currently used for processing).
 * Processed outputs go to game/<name>.png + game/manifest.json (served statically at /game/...).
 *
 * Pipeline per asset (each step is a pure function over { w, h, data: RGBA Uint8ClampedArray }):
 *   generate → chromaKey (+ edge despill) → [sheets] splitFrames → per-frame anchor + area downscale
 *   → align on a uniform frame canvas → palette quantize (shared palette per sheet) → PNG
 *   [layers] chromaKey → seamless crossfade → area downscale → quantize → PNG
 *
 * Reuses lib/gcp.js (auth headers) and the model/project/location settings from lib/infographics.js.
 * Never uploads anything to GCS.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { gcpHeaders } = require('../lib/gcp');
const { INFOGRAPHIC_MODEL, INFOGRAPHIC_LOCATION, INFOGRAPHIC_PROJECT, INFOGRAPHIC_REF_IMAGE } = require('../lib/infographics');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'game');
const RAW_DIR = process.env.GAME_RAW_DIR
  || '/path/to/home/.gemini/antigravity-cli/brain/de7c9517-58b1-4fde-bcc6-80d82dbc7402/scratch/game_raw';

/* ------------------------------------------------------------------------------------------------
 * Asset catalogue
 * ---------------------------------------------------------------------------------------------- */

const STYLE = 'Epic high-fantasy, authentic 16-bit SNES-era pixel art with crisp hard-edged square pixels, '
  + 'a limited palette, dark 1-pixel outlines and clean cel shading.';
const MAGENTA_BG = 'The ENTIRE background is one perfectly flat solid pure magenta colour (#FF00FF, RGB 255,0,255) '
  + 'with no gradient, no texture, no vignette, no floor, no ground line and no shadows.';
const NO_TEXT = 'No text, no letters, no numbers, no watermark, no signature, no UI, no frame borders, no grid lines.';

/**
 * sheetPrompt(subject, frames, action) -> prompt for a single-row sprite sheet.
 * The model is far more consistent when every frame is drawn in ONE image (shared context), so we ask for
 * a strip with generous magenta gaps that splitFrames() can detect as empty columns.
 */
const sheetPrompt = (subject, frames, action) => [
  `Create a ${frames}-frame ${action} sprite sheet of ${subject}.`,
  `Layout: exactly ${frames} frames side by side in ONE single horizontal row, evenly spaced, with a wide empty gap of background between neighbouring frames so no two frames touch or overlap.`,
  'The character is shown in strict side view facing RIGHT (moving towards the right edge of the image) in every frame.',
  'It is the SAME character in every frame: identical size, proportions, colours, outfit and equipment; only the limbs/pose change to form a smooth looping animation.',
  'Every frame shows the full body, vertically centred, all frames aligned on the same baseline.',
  STYLE, MAGENTA_BG, NO_TEXT
].join('\n');

const layerPrompt = (subject, { opaque = false, bottom = true } = {}) => [
  `Create a wide horizontal side-scrolling video game parallax background layer: ${subject}.`,
  'Side view, horizon is horizontal, the layer must tile horizontally: the left and right edges should continue naturally into each other.',
  bottom ? 'The scenery fills the lower part of the image and reaches all the way down to the bottom edge, covering the full width.' : '',
  opaque ? 'The image is fully painted edge to edge (no empty background).'
    : 'Everything above the scenery silhouette is empty: ' + MAGENTA_BG,
  STYLE, NO_TEXT, 'No characters, no animals, no buildings, no people.'
].filter(Boolean).join('\n');

/*
 * kind 'sheet': animated sprite strip. targetH = frame height in pixels, colors = palette size,
 *   align 'bottom' (runners stand on a baseline) | 'center' (flyers bob around a centre).
 *   keepFrames: optional fallback subset (indices into the detected frames) if a cycle stays inconsistent.
 * kind 'layer': parallax strip. h = output height; keyed = chroma key magenta (false for the opaque sky);
 *   cropToContent = trim empty rows (ground strip); parallax = scroll factor for the game.
 */
const ASSETS = [
  {
    name: 'hero_wizard', kind: 'sheet', frames: 6, fps: 10, targetH: 48, colors: 20, align: 'bottom',
    prompt: sheetPrompt('a heroic young wizard in a flowing deep blue robe with a tall pointed blue hat and a wooden staff whose tip glows with bright cyan magic light', 6, 'running cycle')
  },
  {
    name: 'hero_warrior', kind: 'sheet', frames: 6, fps: 10, targetH: 48, colors: 20, align: 'bottom',
    prompt: sheetPrompt('a brave young warrior in light silver plate armour with a flowing red cape, holding a steel sword', 6, 'running cycle')
  },
  {
    name: 'hero_priest', kind: 'sheet', frames: 6, fps: 10, targetH: 48, colors: 20, align: 'bottom',
    prompt: sheetPrompt('a kind young priest in a white robe with gold trim, carrying a glowing golden lantern', 6, 'running cycle')
  },
  {
    name: 'archie', kind: 'sheet', frames: 4, fps: 8, targetH: 32, colors: 16, align: 'center', ref: true,
    prompt: [
      'The attached image is the mascot "Archimedes", a cute black raven. Draw a pixel-art video game sprite of THIS SAME raven.',
      'He wears a black graduate mortarboard cap with a bright GOLD tassel, and one eye is a glowing four-pointed sparkle star (blue-purple Gemini sparkle).',
      sheetPrompt('this raven mascot (black feathers, graduate mortarboard cap, gold tassel, sparkle eye) flying', 4, 'flying wing-flap')
        .replace('full body, vertically centred, all frames aligned on the same baseline', 'full bird with both wings, body at the same height in every frame, wings going up, level, down, level'),
      'Keep it cute and readable at very small size: chibi proportions with an oversized head, a LARGE clearly visible square mortarboard board (with a lighter grey-blue rim highlight so it stands out from the black feathers) and a thick bright gold tassel hanging from the cap, compact body, wings with a dark blue-grey highlight edge.'
    ].join('\n')
  },
  {
    name: 'bg_sky', kind: 'layer', h: 180, keyed: false, parallax: 0.05, colors: 24, aspect: '21:9',
    prompt: layerPrompt('a bright fantasy daytime sky: smooth vertical gradient from deep blue at the top to pale warm blue near the bottom, with a few soft fluffy pixel clouds', { opaque: true, bottom: false })
  },
  {
    name: 'bg_far', kind: 'layer', h: 180, keyed: true, parallax: 0.2, colors: 16, aspect: '21:9',
    prompt: layerPrompt('a distant range of hazy blue-violet mountains and rolling hills silhouettes occupying only the lower half of the image, low contrast atmospheric perspective')
  },
  {
    name: 'bg_mid', kind: 'layer', h: 180, keyed: true, parallax: 0.45, colors: 20, aspect: '21:9',
    prompt: layerPrompt('a dense enchanted fantasy forest tree line (tall pines and round oaks in mid greens and teal) occupying the lower 60 percent of the image, tree tops forming an uneven silhouette')
  },
  {
    name: 'bg_near', kind: 'layer', h: 180, keyed: true, parallax: 0.75, colors: 20, aspect: '21:9',
    prompt: layerPrompt('foreground fantasy bushes, ferns, mushrooms and a few large tree trunks in rich dark greens occupying only the lower 40 percent of the image')
  },
  {
    name: 'ground', kind: 'layer', h: 48, keyed: true, cropToContent: true, parallax: 1, colors: 16, aspect: '21:9',
    prompt: layerPrompt('a single horizontal platform tile strip: a band of lush green grass on top with a jagged grassy top edge, over brown earth with small stones and roots, the band occupies only the lower third of the image')
  },
  /*
   * kind 'sprite': one static object (no frames). Pipeline: chromaKey → trim to the opaque bbox → area
   * downscale to targetH → removeSpecks → quantize. Used by the news scroll UI (CSS border-image + overlay).
   */
  {
    name: 'scroll', kind: 'sprite', targetH: 64, colors: 20, aspect: '21:9',
    prompt: [
      'Create a pixel-art game UI asset: ONE antique parchment scroll, fully unrolled horizontally, seen straight on from the front.',
      'At the far left and far right ends the paper is rolled up into a thick cylinder roll (with small dark wooden knob caps at the top and bottom of each roll). The two rolls are identical mirror images.',
      'Between the rolls is a large, flat, EMPTY sheet of aged cream and tan parchment with soft brown stains, slightly darker burnt edges, and gently wavy top and bottom edges.',
      'The scroll is centred and spans almost the full width of the image, about one third of the image height. Perfectly symmetric and level, not tilted.',
      'No writing, no seal, no ribbon, no decoration on the paper.',
      STYLE, MAGENTA_BG, NO_TEXT
    ].join('\n')
  },
  {
    name: 'wax_seal', kind: 'sprite', targetH: 30, colors: 10, aspect: '1:1',
    prompt: [
      'Create a pixel-art game UI icon: ONE round deep red wax seal with irregular melted blobby edges and a glossy highlight,',
      'stamped in the centre with an embossed four-pointed sparkle star, with two short red silk ribbon tails hanging down below the seal.',
      'Front view, centred, filling about 60 percent of the image.',
      STYLE, MAGENTA_BG, NO_TEXT
    ].join('\n')
  }
];

/* ------------------------------------------------------------------------------------------------
 * Generation (Vertex AI generateContent, image modality)
 * ---------------------------------------------------------------------------------------------- */

const vertexUrl = () => {
  const host = INFOGRAPHIC_LOCATION === 'global' ? 'aiplatform.googleapis.com' : `${INFOGRAPHIC_LOCATION}-aiplatform.googleapis.com`;
  return `https://${host}/v1/projects/${INFOGRAPHIC_PROJECT}/locations/${INFOGRAPHIC_LOCATION}/publishers/google/models/${INFOGRAPHIC_MODEL}:generateContent`;
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const refImagePart = () => {
  const ext = path.extname(INFOGRAPHIC_REF_IMAGE).toLowerCase();
  return { inlineData: { mimeType: ext === '.png' ? 'image/png' : 'image/jpeg', data: fs.readFileSync(INFOGRAPHIC_REF_IMAGE).toString('base64') } };
};

/**
 * callModel(parts, aspectRatio) -> Buffer | throws.
 * Retries 429/5xx with backoff. Extreme aspect ratios (e.g. 4:1 for sprite strips) are not supported by every
 * model revision, so on HTTP 400 we fall back through progressively more common ratios.
 */
async function callModel(parts, aspects) {
  let lastErr;
  for (const aspectRatio of aspects) {
    for (let i = 0; i < 3; i++) {
      const res = await fetch(vertexUrl(), {
        method: 'POST',
        headers: await gcpHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const cand = (data.candidates || [])[0] || {};
        const img = ((cand.content && cand.content.parts) || []).find(p => p.inlineData && p.inlineData.data);
        if (img) return { buffer: Buffer.from(img.inlineData.data, 'base64'), aspectRatio };
        lastErr = new Error(`No image (finishReason ${cand.finishReason || 'unknown'})`);
        break;
      }
      const body = (await res.text()).slice(0, 300);
      lastErr = new Error(`Vertex ${res.status} (${aspectRatio}): ${body}`);
      if (res.status === 400) break; // unsupported aspect -> next ratio
      if (res.status !== 429 && res.status < 500) throw lastErr;
      await sleep(3000 * 2 ** i);
    }
  }
  throw lastErr;
}

const aspectsFor = (asset) => asset.kind === 'sheet'
  ? (asset.frames >= 6 ? ['8:1', '4:1', '21:9'] : ['4:1', '21:9'])
  : ['21:9', '16:9'];

/** generateRaw(asset) -> path of the newly saved attempt (also copied to <name>.png as the active raw). */
async function generateRaw(asset) {
  const parts = [...(asset.ref ? [refImagePart()] : []), { text: asset.prompt }];
  const { buffer, aspectRatio } = await callModel(parts, asset.aspect ? [asset.aspect, ...aspectsFor(asset)] : aspectsFor(asset));
  const png = await sharp(buffer).png().toBuffer();
  const n = fs.readdirSync(RAW_DIR).filter(f => f.startsWith(`${asset.name}.v`)).length + 1;
  const attempt = path.join(RAW_DIR, `${asset.name}.v${n}.png`);
  fs.writeFileSync(attempt, png);
  fs.writeFileSync(path.join(RAW_DIR, `${asset.name}.png`), png);
  console.log(`  ↳ generated ${path.basename(attempt)} (${aspectRatio})`);
  return attempt;
}

/* ------------------------------------------------------------------------------------------------
 * Image helpers (pure)
 * ---------------------------------------------------------------------------------------------- */

const readImage = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: new Uint8ClampedArray(data) };
};
const blank = (w, h) => ({ w, h, data: new Uint8ClampedArray(w * h * 4) });
const toPng = (img) => sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.w, height: img.h, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
const crop = (img, x0, y0, w, h) => {
  const out = blank(w, h);
  for (let y = 0; y < h; y++) {
    const s = ((y0 + y) * img.w + x0) * 4;
    out.data.set(img.data.subarray(s, s + w * 4), y * w * 4);
  }
  return out;
};
const alphaAt = (img, x, y) => img.data[(y * img.w + x) * 4 + 3];

/**
 * estimateKey(img) -> [r,g,b]
 * The model rarely paints exactly #FF00FF, so the key colour is the per-channel median of the strongly
 * magenta pixels found on the outer border ring (the border is background in every prompt).
 */
const estimateKey = (img) => {
  const samples = [];
  const ring = 6;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (x >= ring && x < img.w - ring && y >= ring && y < img.h - ring) continue;
      const i = (y * img.w + x) * 4;
      const [r, g, b] = [img.data[i], img.data[i + 1], img.data[i + 2]];
      if (Math.min(r, b) - g > 80) samples.push([r, g, b]);
    }
  }
  if (samples.length < 20) return [255, 0, 255];
  const med = (c) => samples.map(s => s[c]).sort((a, b) => a - b)[samples.length >> 1];
  return [med(0), med(1), med(2)];
};

/**
 * chromaKey(img, { low, high }) -> new image with magenta removed.
 *
 * 1. Alpha from RGB distance d to the key colour: d <= low → 0, d >= high → 255, linear in between.
 *    A secondary "magenta-ness" test (min(r,b) - g large, r≈b) also clears off-key magenta noise/JPEG blocks.
 * 2. Un-mixing for partial pixels: observed = a·fg + (1-a)·key  ⇒  fg = (observed - (1-a)·key) / a.
 * 3. Edge despill: pixels within 2px of transparency that still carry a magenta cast
 *    (spill = min(r,b) - g > 0) have that spill subtracted from r and b, which turns the typical
 *    anti-aliased magenta fringe into the neighbouring dark outline colour instead of pink.
 *    Restricting despill to edges protects legitimately purple interiors.
 */
const chromaKey = (img, { low = 70, high = 150 } = {}) => {
  const key = estimateKey(img);
  const out = { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) };
  const d = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const dist = Math.hypot(r - key[0], g - key[1], b - key[2]);
    const magentaNoise = Math.min(r, b) - g > 150 && Math.abs(r - b) < 70;
    let a = magentaNoise ? 0 : dist <= low ? 0 : dist >= high ? 1 : (dist - low) / (high - low);
    if (a > 0 && a < 1) {
      for (let c = 0; c < 3; c++) d[i + c] = (d[i + c] - (1 - a) * key[c]) / a;
    }
    d[i + 3] = Math.round(a * 255);
  }
  // Edge mask: opaque pixels with a transparent pixel within Chebyshev radius 2.
  const R = 2;
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const i = (y * out.w + x) * 4;
      if (d[i + 3] === 0) continue;
      let edge = false;
      for (let dy = -R; dy <= R && !edge; dy++) {
        for (let dx = -R; dx <= R && !edge; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < out.w && yy < out.h && d[(yy * out.w + xx) * 4 + 3] < 128) edge = true;
        }
      }
      if (!edge) continue;
      const spill = Math.min(d[i], d[i + 2]) - d[i + 1];
      if (spill > 0) { d[i] -= spill; d[i + 2] -= spill; }
    }
  }
  return out;
};

/**
 * areaDownscale(img, outW, outH, { accentBias }) -> pixel-grid image.
 * Each output pixel averages the source box it covers (premultiplied by alpha so transparent pixels never
 * tint the colour). Coverage >= 50% becomes fully opaque, otherwise fully transparent: pixel art has
 * binary alpha. This is the "true grid" step; the palette quantizer then removes the in-between colours.
 * accentBias (sprites): if >= 25% of a cell's opaque pixels are "accent" pixels (chroma >= 110 and
 * brightness >= 140, e.g. gold tassel, sparkle eye, magic glow), the cell takes the average of only those
 * pixels. Hand-made pixel art exaggerates such details; plain averaging would mud them into the outline.
 */
const areaDownscale = (img, outW, outH, { accentBias = false } = {}) => {
  const out = blank(outW, outH);
  const sx = img.w / outW, sy = img.h / outH;
  const isAccent = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) >= 110 && Math.max(r, g, b) >= 140;
  for (let oy = 0; oy < outH; oy++) {
    const y0 = Math.floor(oy * sy), y1 = Math.max(y0 + 1, Math.floor((oy + 1) * sy));
    for (let ox = 0; ox < outW; ox++) {
      const x0 = Math.floor(ox * sx), x1 = Math.max(x0 + 1, Math.floor((ox + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0, op = 0;
      let ar = 0, ag = 0, ab = 0, an = 0;
      for (let y = y0; y < y1 && y < img.h; y++) {
        for (let x = x0; x < x1 && x < img.w; x++) {
          const i = (y * img.w + x) * 4, al = img.data[i + 3];
          r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++;
          if (al > 127) {
            op++;
            if (accentBias && isAccent(img.data[i], img.data[i + 1], img.data[i + 2])) { ar += img.data[i]; ag += img.data[i + 1]; ab += img.data[i + 2]; an++; }
          }
        }
      }
      const o = (oy * outW + ox) * 4;
      if (n && a / n >= 128) {
        if (an && an >= op * 0.25) { out.data[o] = ar / an; out.data[o + 1] = ag / an; out.data[o + 2] = ab / an; }
        else { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
        out.data[o + 3] = 255;
      }
    }
  }
  return out;
};

/**
 * removeSpecks(img) -> drops isolated opaque pixels with no opaque 4-neighbour (downscale noise).
 */
const removeSpecks = (img) => {
  const out = { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) };
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (!alphaAt(img, x, y)) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const xx = x + dx, yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < img.w && yy < img.h && alphaAt(img, xx, yy);
      });
      if (!nb) out.data[(y * img.w + x) * 4 + 3] = 0;
    }
  }
  return out;
};

/**
 * buildPalette(pixels, k) -> [[r,g,b], ...]
 * Median cut: start with one box holding every opaque colour; repeatedly split the box with the largest
 * (range × population) along its widest channel at the median, until k boxes. Each box's mean is a palette
 * entry. Then 4 Lloyd (k-means) iterations refine the entries towards the actual colour clusters.
 */
const buildPalette = (pixels, k) => {
  if (!pixels.length) return [[0, 0, 0]];
  const range = (box) => [0, 1, 2].map(c => {
    let lo = 255, hi = 0;
    for (const p of box) { if (p[c] < lo) lo = p[c]; if (p[c] > hi) hi = p[c]; }
    return hi - lo;
  });
  let boxes = [pixels];
  while (boxes.length < k) {
    const scored = boxes.map((b, i) => ({ i, rg: range(b), score: Math.max(...range(b)) * Math.sqrt(b.length) }))
      .filter(s => boxes[s.i].length > 1 && Math.max(...s.rg) > 0)
      .sort((a, b) => b.score - a.score);
    if (!scored.length) break;
    const { i, rg } = scored[0];
    const c = rg.indexOf(Math.max(...rg));
    const sorted = [...boxes[i]].sort((a, b) => a[c] - b[c]);
    const mid = sorted.length >> 1;
    boxes = [...boxes.slice(0, i), sorted.slice(0, mid), sorted.slice(mid), ...boxes.slice(i + 1)];
  }
  const mean = (box) => [0, 1, 2].map(c => box.reduce((s, p) => s + p[c], 0) / box.length);
  let pal = boxes.map(mean);
  for (let iter = 0; iter < 4; iter++) {
    const acc = pal.map(() => [0, 0, 0, 0]);
    for (const p of pixels) {
      const j = nearest(pal, p);
      acc[j][0] += p[0]; acc[j][1] += p[1]; acc[j][2] += p[2]; acc[j][3]++;
    }
    pal = pal.map((c, j) => acc[j][3] ? [acc[j][0] / acc[j][3], acc[j][1] / acc[j][3], acc[j][2] / acc[j][3]] : c);
  }
  return pal.map(c => c.map(Math.round));
};

// Nearest palette index using a luma-weighted squared distance (greens/luminance matter more to the eye).
const nearest = (pal, p) => {
  let best = 0, bd = Infinity;
  for (let j = 0; j < pal.length; j++) {
    const dr = p[0] - pal[j][0], dg = p[1] - pal[j][1], db = p[2] - pal[j][2];
    const dd = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
    if (dd < bd) { bd = dd; best = j; }
  }
  return best;
};

const opaquePixels = (img) => {
  const px = [];
  for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]) px.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
  return px;
};

/**
 * accentAwarePalette(pixels, k, accents) -> palette
 * Plain median cut is population-driven, so a tiny but important saturated detail (Archie's gold tassel and
 * sparkle eye, the wizard's staff glow) gets absorbed into the dominant dark/neutral boxes. Pixels with
 * chroma (max - min channel) >= 120 (above typical skin tones) that make up 0.3–25% of the sprite are therefore quantized on their own
 * with `accents` reserved entries; the remaining k - accents entries cover everything else.
 */
const accentAwarePalette = (pixels, k, accents) => {
  const chroma = (p) => Math.max(...p) - Math.min(...p);
  const acc = pixels.filter(p => chroma(p) >= 120);
  const share = acc.length / Math.max(1, pixels.length);
  if (!accents || share < 0.003 || share > 0.25) return buildPalette(pixels, k);
  return [...buildPalette(pixels.filter(p => chroma(p) < 120), k - accents), ...buildPalette(acc, accents)];
};

/** quantize(img, k, accents) -> { img, palette }: maps every opaque pixel onto a k-colour palette. */
const quantize = (img, k, accents = 0) => {
  const palette = accentAwarePalette(opaquePixels(img), k, accents);
  const out = { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) };
  for (let i = 0; i < out.data.length; i += 4) {
    if (!out.data[i + 3]) { out.data[i] = out.data[i + 1] = out.data[i + 2] = 0; continue; }
    const c = palette[nearest(palette, [out.data[i], out.data[i + 1], out.data[i + 2]])];
    out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2]; out.data[i + 3] = 255;
  }
  return { img: out, palette };
};

/* ------------------------------------------------------------------------------------------------
 * Sprite sheets
 * ---------------------------------------------------------------------------------------------- */

/**
 * runs(occupancy, minGap) -> [[start, endExclusive], ...]
 * Contiguous runs of occupied indices; gaps shorter than minGap are bridged (e.g. a gap between a staff
 * and the hand holding it is not a frame boundary).
 */
const runs = (occ, minGap) => {
  const out = [];
  let start = -1, lastOn = -1;
  occ.forEach((on, i) => {
    if (!on) return;
    if (start < 0) start = i;
    else if (i - lastOn > minGap) { out.push([start, lastOn + 1]); start = i; }
    lastOn = i;
  });
  if (start >= 0) out.push([start, lastOn + 1]);
  return out;
};

/**
 * splitFrames(img, n) -> [{ x0, y0, x1, y1 }] (n bounding boxes in source pixels, left→right, row by row)
 *
 * 1. Row bands: rows containing opaque pixels, bridged over small gaps; tiny bands (< 8% of the tallest)
 *    are noise. Usually one band; a 2-row sheet yields two.
 * 2. Within each band, column occupancy (> 2 opaque px) → runs = candidate frames.
 * 3. Reconcile to exactly n:
 *    - fragments narrower than 35% of the median width are merged into the nearer neighbour
 *      (detached glows, sparkles, sword tips);
 *    - while too many: merge the adjacent pair separated by the smallest gap;
 *    - while too few: split the widest candidate into equal halves (touching frames fallback).
 * 4. Each final box is tightened to its alpha bounding box.
 */
const splitFrames = (img, n) => {
  const colCount = (y0, y1) => Array.from({ length: img.w }, (_, x) => {
    let c = 0; for (let y = y0; y < y1; y++) if (alphaAt(img, x, y) > 127) c++; return c;
  });
  const rowOcc = Array.from({ length: img.h }, (_, y) => {
    let c = 0; for (let x = 0; x < img.w; x++) if (alphaAt(img, x, y) > 127) c++; return c > 2;
  });
  let bands = runs(rowOcc, Math.round(img.h * 0.03));
  const tallest = Math.max(...bands.map(([a, b]) => b - a));
  bands = bands.filter(([a, b]) => b - a >= tallest * 0.08);

  let cands = bands.flatMap(([y0, y1]) => runs(colCount(y0, y1).map(c => c > 2), Math.round(img.w * 0.004))
    .map(([x0, x1]) => ({ x0, x1, y0, y1 })));

  const width = (c) => c.x1 - c.x0;
  const mergeAt = (list, i) => [...list.slice(0, i), { x0: list[i].x0, x1: list[i + 1].x1, y0: Math.min(list[i].y0, list[i + 1].y0), y1: Math.max(list[i].y1, list[i + 1].y1) }, ...list.slice(i + 2)];
  const sameBand = (a, b) => a.y0 === b.y0 || (a.y0 < b.y1 && b.y0 < a.y1);

  // Merge slivers into the closer neighbour.
  for (let guard = 0; guard < 100; guard++) {
    const med = [...cands].map(width).sort((a, b) => a - b)[cands.length >> 1];
    const i = cands.findIndex(c => width(c) < med * 0.35);
    if (i < 0 || cands.length <= 1) break;
    const gl = i > 0 && sameBand(cands[i - 1], cands[i]) ? cands[i].x0 - cands[i - 1].x1 : Infinity;
    const gr = i < cands.length - 1 && sameBand(cands[i], cands[i + 1]) ? cands[i + 1].x0 - cands[i].x1 : Infinity;
    if (gl === Infinity && gr === Infinity) { cands = cands.filter((_, j) => j !== i); continue; }
    cands = gl <= gr ? mergeAt(cands, i - 1) : mergeAt(cands, i);
  }
  // The model sometimes draws MORE frames than asked (e.g. an 8-frame cycle instead of 6). If every
  // candidate is a full-size figure (all within 70–140% of the median width) and they are clearly separated,
  // they are real frames: keep them all instead of gluing neighbours together.
  const medW = [...cands].map(width).sort((a, b) => a - b)[cands.length >> 1];
  const uniform = cands.length > n && cands.every(c => width(c) > medW * 0.7 && width(c) < medW * 1.4);
  while (!uniform && cands.length > n) {
    let bi = -1, bg = Infinity;
    for (let i = 0; i < cands.length - 1; i++) {
      const g = sameBand(cands[i], cands[i + 1]) ? cands[i + 1].x0 - cands[i].x1 : Infinity;
      if (g < bg) { bg = g; bi = i; }
    }
    if (bi < 0) { cands = cands.slice(0, n); break; }
    cands = mergeAt(cands, bi);
  }
  while (cands.length < n) {
    const i = cands.reduce((bi, c, j) => (width(c) > width(cands[bi]) ? j : bi), 0);
    const c = cands[i], mid = Math.round((c.x0 + c.x1) / 2);
    cands = [...cands.slice(0, i), { ...c, x1: mid }, { ...c, x0: mid }, ...cands.slice(i + 1)];
  }

  // Tighten to alpha bbox.
  return cands.map(({ x0, x1, y0, y1 }) => {
    let bx0 = x1, bx1 = x0, by0 = y1, by1 = y0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (alphaAt(img, x, y) > 127) { if (x < bx0) bx0 = x; if (x >= bx1) bx1 = x + 1; if (y < by0) by0 = y; if (y >= by1) by1 = y + 1; }
    }
    return { x0: bx0, y0: by0, x1: Math.max(bx1, bx0 + 1), y1: Math.max(by1, by0 + 1) };
  });
};

/**
 * anchorOf(img, box, align) -> { ax, ay } in source pixels relative to the box.
 * Horizontal anchor = alpha centroid of the upper 60% of the figure (head + torso). Using the body mass
 * instead of the bbox centre keeps the torso steady while legs, capes and weapons swing.
 * Vertical: 'bottom' → feet on the baseline (box bottom); 'center' → centroid of the whole figure (flyers).
 */
const anchorOf = (img, box, align) => {
  const h = box.y1 - box.y0;
  let sx = 0, n = 0, sy = 0, m = 0;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    if (alphaAt(img, x, y) <= 127) continue;
    if (y < box.y0 + h * 0.6) { sx += x; n++; }
    sy += y; m++;
  }
  return { ax: (n ? sx / n : (box.x0 + box.x1) / 2) - box.x0, ay: align === 'center' ? (m ? sy / m : (box.y0 + box.y1) / 2) - box.y0 : h };
};

/**
 * buildSheet(keyed, asset) -> { img, frameW, frameH, frames, palette, frameStats }
 * One uniform scale for all frames (from the tallest frame / largest vertical extent around the anchor), so
 * characters never change size between frames. Each frame is downscaled on its own and pasted so that its
 * anchor lands on the same canvas point; frameW is the smallest even width that fits every frame.
 * Quantization runs once over the whole strip → one shared palette → consistent colours across frames.
 */
const buildSheet = (keyed, asset) => {
  const allBoxes = splitFrames(keyed, asset.frames);
  const boxes = asset.keepFrames ? asset.keepFrames.map(i => allBoxes[i]) : allBoxes;
  const anchors = boxes.map(b => anchorOf(keyed, b, asset.align));
  const frameH = asset.targetH;
  const usable = frameH - 2;
  /*
   * Vertical fit. 'bottom': tallest frame fills the usable height. 'center': every frame's centroid sits on
   * one shared line c, so the stack needs (max distance centroid→top) + (max distance centroid→bottom);
   * that is tighter than 2 × the worst half-extent and keeps flapping wings inside the canvas.
   */
  const above = Math.max(...anchors.map(a => a.ay));
  const below = Math.max(...boxes.map((b, i) => (b.y1 - b.y0) - anchors[i].ay));
  const extentV = asset.align === 'center' ? above + below : Math.max(...boxes.map(b => b.y1 - b.y0));
  const s = usable / extentV;
  const centreLine = 1 + above * s;

  const smalls = boxes.map((b, i) => {
    const w = Math.max(1, Math.round((b.x1 - b.x0) * s)), h = Math.max(1, Math.round((b.y1 - b.y0) * s));
    return { img: removeSpecks(areaDownscale(crop(keyed, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0), w, h, { accentBias: true })), ax: anchors[i].ax * s, ay: anchors[i].ay * s };
  });
  const halfW = Math.max(...smalls.map(f => Math.max(f.ax, f.img.w - f.ax)));
  const frameW = Math.ceil(halfW + 1) * 2;

  const sheet = blank(frameW * smalls.length, frameH);
  smalls.forEach((f, i) => {
    const ox = i * frameW + Math.round(frameW / 2 - f.ax);
    const oy = asset.align === 'center' ? Math.round(centreLine - f.ay) : frameH - 1 - f.img.h;
    for (let y = 0; y < f.img.h; y++) for (let x = 0; x < f.img.w; x++) {
      const si = (y * f.img.w + x) * 4;
      if (!f.img.data[si + 3]) continue;
      const tx = ox + x, ty = oy + y;
      if (tx < i * frameW || tx >= (i + 1) * frameW || ty < 0 || ty >= frameH) continue;
      sheet.data.set(f.img.data.subarray(si, si + 4), (ty * sheet.w + tx) * 4);
    }
  });
  const { img, palette } = quantize(sheet, asset.colors, 4);
  const frameStats = smalls.map(f => ({ w: f.img.w, h: f.img.h }));
  return { img, frameW, frameH, frames: smalls.length, palette, frameStats, detected: allBoxes.length };
};

/* ------------------------------------------------------------------------------------------------
 * Parallax layers
 * ---------------------------------------------------------------------------------------------- */

/**
 * seamless(img, { search, bandFrac }) -> image that tiles horizontally.
 *
 * 1. Best-match cut: search a left column L in the first `search` fraction and a right column R in the last
 *    `search` fraction minimising the colour+alpha difference between column R and column L (sampled every
 *    2nd row). Cropping to [L, R) puts two near-identical columns next to each other at the wrap, so for
 *    skies the seam usually lands in clear gradient rather than through a cloud.
 * 2. Short crossfade over the remaining residual: the first B columns become a linear blend of the original
 *    first B columns (weight t = x/B) and the LAST B columns (weight 1 - t), which are then cut off. At x = 0
 *    the output equals the column that follows the new right edge, so the wrap is continuous; at x = B it
 *    is untouched. Alpha is blended too and later re-binarized by areaDownscale.
 */
const seamless = (img, { search = 0.12, bandFrac = 0.04 } = {}) => {
  const colDiff = (xa, xb) => {
    let s = 0;
    for (let y = 0; y < img.h; y += 2) {
      const a = (y * img.w + xa) * 4, b = (y * img.w + xb) * 4;
      for (let c = 0; c < 4; c++) s += Math.abs(img.data[a + c] - img.data[b + c]);
    }
    return s;
  };
  const S = Math.round(img.w * search);
  let best = { L: 0, R: img.w, d: Infinity };
  for (let L = 0; L < S; L += 2) {
    for (let R = img.w - S; R < img.w; R += 2) {
      const d = colDiff(L, R);
      if (d < best.d) best = { L, R, d };
    }
  }
  const src = crop(img, best.L, 0, best.R - best.L, img.h);
  const B = Math.round(src.w * bandFrac), W = src.w - B;
  const out = blank(W, src.h);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4, a = (y * src.w + x) * 4;
      if (x >= B) { out.data.set(src.data.subarray(a, a + 4), o); continue; }
      const t = x / B, b = (y * src.w + x + W) * 4;
      const aa = src.data[a + 3] * t, ab = src.data[b + 3] * (1 - t), at = aa + ab;
      for (let c = 0; c < 3; c++) out.data[o + c] = at ? (src.data[a + c] * aa + src.data[b + c] * ab) / at : 0;
      out.data[o + 3] = at;
    }
  }
  return out;
};

/** contentRows(img) -> [y0, y1) of rows that contain opaque pixels (used to crop the ground strip). */
const contentRows = (img) => {
  let y0 = img.h, y1 = 0;
  for (let y = 0; y < img.h; y++) {
    let c = 0; for (let x = 0; x < img.w; x++) if (alphaAt(img, x, y) > 127) c++;
    if (c > img.w * 0.02) { y0 = Math.min(y0, y); y1 = y + 1; }
  }
  return y1 > y0 ? [y0, y1] : [0, img.h];
};

/**
 * fillBottom(img) -> for keyed layers whose scenery should reach the bottom edge, any transparent pixel
 * below the topmost opaque pixel of its column is filled with the colour above it (closes model gaps so
 * the layer never shows sky through its base).
 */
const fillBottom = (img) => {
  const out = { w: img.w, h: img.h, data: new Uint8ClampedArray(img.data) };
  for (let x = 0; x < img.w; x++) {
    let last = null;
    for (let y = Math.floor(img.h * 0.5); y < img.h; y++) {
      const i = (y * img.w + x) * 4;
      if (out.data[i + 3]) last = out.data.slice(i, i + 4);
      else if (last) out.data.set(last, i);
    }
  }
  return out;
};

const buildLayer = (raw, asset) => {
  let img = asset.keyed ? chromaKey(raw) : raw;
  if (asset.cropToContent) {
    const [y0, y1] = contentRows(img);
    img = crop(img, 0, y0, img.w, y1 - y0);
  }
  img = seamless(img);
  const w = Math.round(img.w * asset.h / img.h);
  let small = areaDownscale(img, w, asset.h);
  if (asset.keyed) small = fillBottom(removeSpecks(small));
  const { img: q, palette } = quantize(small, asset.colors);
  return { img: q, w, h: asset.h, palette };
};

/* ------------------------------------------------------------------------------------------------
 * Contact sheets (review aid)
 * ---------------------------------------------------------------------------------------------- */

const checkerboard = (w, h, size = 8) => {
  const img = blank(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = ((x / size | 0) + (y / size | 0)) % 2 ? 200 : 235, i = (y * w + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  return toPng(img);
};

/**
 * contactSheet(items, outFile, { scale, maxW }) - stacks labelled PNGs vertically on a checkerboard.
 * Processed assets are upscaled with nearest-neighbour (kernel 'nearest') so pixels stay crisp;
 * raw outputs are downscaled to maxW so the review image stays small.
 * Items with `tile: true` (parallax layers) are drawn twice side by side at half the scale, so the
 * horizontal wrap seam can be inspected in the middle.
 */
async function contactSheet(items, outFile, { scale = 4, maxW = 1600 } = {}) {
  const tiles = await Promise.all(items.map(async ({ label, file, tile }) => {
    const meta = await sharp(file).metadata();
    const src = tile
      ? await sharp({ create: { width: meta.width * 2, height: meta.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: file, left: 0, top: 0 }, { input: file, left: meta.width, top: 0 }]).png().toBuffer()
      : file;
    const k = tile ? scale / 2 : scale;
    let w = meta.width * (tile ? 2 : 1) * k, h = meta.height * k;
    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    const buf = await sharp(src).resize(Math.round(w), Math.round(h), { kernel: k >= 1 ? 'nearest' : 'lanczos3' }).png().toBuffer();
    return { label, buf, w: Math.round(w), h: Math.round(h) };
  }));
  const pad = 10, labelH = 22;
  const W = Math.max(...tiles.map(t => t.w)) + pad * 2;
  const H = tiles.reduce((s, t) => s + t.h + labelH + pad, pad);
  const composites = [];
  let y = pad;
  for (const t of tiles) {
    const svg = `<svg width="${W}" height="${labelH}"><text x="${pad}" y="16" font-family="Helvetica" font-size="15" fill="#222">${t.label}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left: 0, top: y });
    composites.push({ input: t.buf, left: pad, top: y + labelH });
    y += t.h + labelH + pad;
  }
  await sharp(await checkerboard(W, H)).composite(composites).png().toFile(outFile);
  console.log(`🖼  contact sheet → ${outFile}`);
}

/* ------------------------------------------------------------------------------------------------
 * Main
 * ---------------------------------------------------------------------------------------------- */

const parseArgs = (argv) => {
  const val = (k) => (argv.find(a => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || null;
  return {
    force: argv.includes('--force'),
    noGen: argv.includes('--no-gen'),
    only: (val('only') || '').split(',').map(s => s.trim()).filter(Boolean),
    contact: val('contact'),
    rawContact: val('raw-contact')
  };
};

async function processAsset(asset, rawFile) {
  const raw = await readImage(rawFile);
  if (asset.kind === 'sprite') {
    // Trim to the opaque bounding box so targetH maps to the object itself, not the canvas.
    const keyed = chromaKey(raw);
    let x0 = keyed.w, y0 = keyed.h, x1 = -1, y1 = -1;
    for (let y = 0; y < keyed.h; y++) for (let x = 0; x < keyed.w; x++) {
      if (alphaAt(keyed, x, y) > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) throw new Error('sprite is empty after chroma key');
    const box = crop(keyed, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    const w = Math.max(1, Math.round(box.w * asset.targetH / box.h));
    const { img } = quantize(removeSpecks(areaDownscale(box, w, asset.targetH)), asset.colors);
    fs.writeFileSync(path.join(OUT_DIR, `${asset.name}.png`), await toPng(img));
    console.log(`  ✓ ${asset.name}.png ${w}x${asset.targetH}`);
    return { file: `${asset.name}.png`, w, h: asset.targetH };
  }
  if (asset.kind === 'sheet') {
    const r = buildSheet(chromaKey(raw), asset);
    fs.writeFileSync(path.join(OUT_DIR, `${asset.name}.png`), await toPng(r.img));
    console.log(`  ✓ ${asset.name}.png ${r.img.w}x${r.img.h} · ${r.frames} frames ${r.frameW}x${r.frameH} · detected ${r.detected} · frame sizes ${r.frameStats.map(f => `${f.w}x${f.h}`).join(' ')}`);
    return {
      file: `${asset.name}.png`, frameW: r.frameW, frameH: r.frameH, frames: r.frames, fps: asset.fps,
      ...(asset.keepFrames ? { fallback: `using frames ${asset.keepFrames.join(',')} of ${asset.frames}` } : {})
    };
  }
  const r = buildLayer(raw, asset);
  fs.writeFileSync(path.join(OUT_DIR, `${asset.name}.png`), await toPng(r.img));
  console.log(`  ✓ ${asset.name}.png ${r.w}x${r.h}`);
  return { file: `${asset.name}.png`, w: r.w, h: r.h, parallax: asset.parallax };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  const selected = ASSETS.filter(a => !args.only.length || args.only.includes(a.name));

  // Generate concurrently (bounded to 3 in flight) — the model call dominates runtime.
  const queue = selected.filter(a => !args.noGen && (args.force || !fs.existsSync(path.join(RAW_DIR, `${a.name}.png`))));
  const failures = [];
  const worker = async () => {
    while (queue.length) {
      const a = queue.shift();
      console.log(`🎨 generating ${a.name}…`);
      try { await generateRaw(a); } catch (err) { failures.push(a.name); console.error(`  ✗ ${a.name}: ${err.message}`); }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  for (const asset of selected) {
    const rawFile = path.join(RAW_DIR, `${asset.name}.png`);
    if (!fs.existsSync(rawFile)) { console.warn(`  – ${asset.name}: no raw image, skipped`); continue; }
    try { manifest[asset.name] = await processAsset(asset, rawFile); } catch (err) { console.error(`  ✗ process ${asset.name}: ${err.stack}`); }
  }
  // Stable key order = catalogue order.
  const ordered = Object.fromEntries(ASSETS.filter(a => manifest[a.name]).map(a => [a.name, manifest[a.name]]));
  fs.writeFileSync(manifestPath, `${JSON.stringify(ordered, null, 2)}\n`);
  console.log(`📄 manifest → ${path.relative(ROOT, manifestPath)}`);

  if (args.contact) {
    await contactSheet(selected.filter(a => ordered[a.name]).map(a => ({ label: `${a.name} ${JSON.stringify(ordered[a.name])}`, file: path.join(OUT_DIR, `${a.name}.png`), tile: a.kind === 'layer' })), args.contact, { scale: 4, maxW: 1800 });
  }
  if (args.rawContact) {
    await contactSheet(selected.filter(a => fs.existsSync(path.join(RAW_DIR, `${a.name}.png`))).map(a => ({ label: a.name, file: path.join(RAW_DIR, `${a.name}.png`) })), args.rawContact, { scale: 1, maxW: 1200 });
  }
  if (failures.length) process.exitCode = 1;
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}

module.exports = { ASSETS, chromaKey, splitFrames, areaDownscale, quantize, seamless, buildSheet, buildLayer, contactSheet };
