#!/usr/bin/env node
/* scripts/generate-infographics.js - Backfill / regenerate use case infographics
 *
 * Usage:
 *   npm run infographics                         # only use cases without an infographic
 *   npm run infographics -- --force              # regenerate every use case
 *   npm run infographics -- --id=socratic_tutor  # one use case (always regenerated)
 *   npm run infographics -- --print-prompt --id=socratic_tutor   # show the prompt, no API calls
 *   npm run infographics -- --force --save-dir=./out             # also keep a local copy of each image
 *
 * Writes `infographic_url` to whichever DB DATABASE_URL points to (SQLite edu_portal.db when unset).
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createDb } = require('../lib/db');
const {
  generateAndUpload, buildInfographicPrompt, INFOGRAPHIC_BUCKET, INFOGRAPHIC_MODEL, INFOGRAPHIC_REF_IMAGE
} = require('../lib/infographics');

const parseArgs = (argv) => ({
  force: argv.includes('--force'),
  printPrompt: argv.includes('--print-prompt'),
  saveDir: (argv.find(a => a.startsWith('--save-dir=')) || '').slice('--save-dir='.length) || null,
  ids: argv
    .filter(a => a.startsWith('--id='))
    .flatMap(a => a.slice(5).split(','))
    .map(s => s.trim())
    .filter(Boolean)
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = createDb();

  // Make sure the column exists even if the server has not booted against this DB yet.
  await db.query('ALTER TABLE use_cases ADD COLUMN infographic_url TEXT').catch(() => {});

  const rows = await db.query('SELECT id, title, summary, features, steps, infographic_url FROM use_cases ORDER BY id ASC');
  const targets = rows.filter(r => (args.ids.length
    ? args.ids.includes(r.id)
    : (args.force || !r.infographic_url)));

  const missingIds = args.ids.filter(id => !rows.some(r => r.id === id));
  if (missingIds.length) console.warn(`⚠️  Unknown use case id(s): ${missingIds.join(', ')}`);

  if (args.printPrompt) {
    const hasRef = fs.existsSync(INFOGRAPHIC_REF_IMAGE);
    targets.forEach(uc => console.log(`\n=== ${uc.id} ===\n${buildInfographicPrompt(uc, { hasRef })}`));
    await db.close();
    return;
  }

  console.log(`🎨 ${targets.length} infographic(s) to generate with ${INFOGRAPHIC_MODEL} → gs://${INFOGRAPHIC_BUCKET}`);
  console.log(`   Character reference: ${fs.existsSync(INFOGRAPHIC_REF_IMAGE) ? INFOGRAPHIC_REF_IMAGE : 'none (text-only)'}`);
  if (args.saveDir) fs.mkdirSync(args.saveDir, { recursive: true });

  // Sequential on purpose: keeps us well under image-model quotas and makes logs readable.
  const results = [];
  for (const uc of targets) {
    const started = Date.now();
    try {
      const { url, bytes, mimeType, buffer } = await generateAndUpload(uc);
      if (args.saveDir) {
        fs.writeFileSync(path.join(args.saveDir, `${uc.id}.${mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1]}`), buffer);
      }
      await db.query('UPDATE use_cases SET infographic_url = ? WHERE id = ?', [url, uc.id]);
      console.log(`✅ ${uc.id} (${mimeType}, ${Math.round(bytes / 1024)} KB, ${((Date.now() - started) / 1000).toFixed(1)}s)\n   ${url}`);
      results.push({ id: uc.id, ok: true, url });
    } catch (err) {
      console.error(`❌ ${uc.id}: ${err.message}`);
      results.push({ id: uc.id, ok: false, error: err.message });
    }
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\nDone: ${results.length - failed.length} generated, ${failed.length} failed.`);
  await db.close();
  if (failed.length) process.exitCode = 1;
}

main().catch(err => {
  console.error('❌ Infographic generation failed:', err);
  process.exit(1);
});
