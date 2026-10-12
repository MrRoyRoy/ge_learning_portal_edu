/* server.js - Dynamic Express Backend with Dual Database Support (PostgreSQL / SQLite) */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Shared libraries (required after dotenv so env overrides apply)
const { createDb } = require('./lib/db');
const { createDbSessionStore } = require('./lib/session-store');
const { gcpHeaders } = require('./lib/gcp');
const mailer = require('./lib/mailer');
const { encrypt } = require('./lib/secrets');
const infographics = require('./lib/infographics');

const app = express();
const PORT = process.env.PORT || 8080;

// ==========================================
// 1. Database Connection & Table Schema Setup
// ==========================================
// Created before the session middleware because sessions are persisted in the same database.
const db = createDb();
const { dbType, query } = db;

// Body Parsers and Static Asset Delivery
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Explicit Favicon Route Handler
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'favicon.ico'));
});

// Serve static assets from project root and public subdirectories (before sessions: no DB lookup per asset)
app.use(express.static(__dirname));

// Express Session Management — stored in the DB (lib/session-store.js) so a session survives
// Cloud Run scale-to-zero, new revisions and multiple instances (MemoryStore lost them → 401s on likes).
app.use(session({
  store: createDbSessionStore(session, db),
  secret: process.env.SESSION_SECRET || 'edu-gemini-enterprise-swiss-minimalist-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production if running behind HTTPS/SSL
    maxAge: 24 * 60 * 60 * 1000 // 1 day session longevity
  }
}));

// Unify table schemas across Postgres and SQLite dialects
async function initializeSchemas() {
  const createUsersTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS users (
      email VARCHAR(255) PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      is_temp_password BOOLEAN DEFAULT TRUE,
      role VARCHAR(100) DEFAULT NULL,
      institution_level VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      is_temp_password INTEGER DEFAULT 1,
      role TEXT DEFAULT NULL,
      institution_level TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createUseCasesTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS use_cases (
      id VARCHAR(100) PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      features TEXT NOT NULL,       -- JSON Array
      connectors TEXT NOT NULL,     -- JSON Array
      role VARCHAR(100) NOT NULL,
      level TEXT NOT NULL,          -- JSON Array
      steps TEXT NOT NULL,          -- JSON Array
      prompt TEXT NOT NULL,
      pro_tip TEXT NOT NULL,
      connector_guide TEXT,
      translations TEXT NOT NULL,   -- JSON translations dictionary
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS use_cases (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      features TEXT NOT NULL,
      connectors TEXT NOT NULL,
      role TEXT NOT NULL,
      level TEXT NOT NULL,
      steps TEXT NOT NULL,
      prompt TEXT NOT NULL,
      pro_tip TEXT NOT NULL,
      connector_guide TEXT,
      translations TEXT NOT NULL,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPreferencesTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
      use_case_id VARCHAR(100) REFERENCES use_cases(id) ON DELETE CASCADE,
      is_liked BOOLEAN DEFAULT FALSE,
      is_deployed BOOLEAN DEFAULT FALSE,
      PRIMARY KEY (user_email, use_case_id)
    );
  ` : `
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_email TEXT,
      use_case_id TEXT,
      is_liked INTEGER DEFAULT 0,
      is_deployed INTEGER DEFAULT 0,
      PRIMARY KEY (user_email, use_case_id),
      FOREIGN KEY(user_email) REFERENCES users(email) ON DELETE CASCADE,
      FOREIGN KEY(use_case_id) REFERENCES use_cases(id) ON DELETE CASCADE
    );
  `;

  const createAnalyticsTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS analytics (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      action VARCHAR(50) NOT NULL, -- 'view', 'like', 'try' (legacy rows may hold 'deploy')
      use_case_id VARCHAR(100),
      user_email VARCHAR(255)
    );
  ` : `
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL,
      use_case_id TEXT,
      user_email TEXT
    );
  `;

  const createFeedbacksTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS feedbacks (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      feedback_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      feedback_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await query(createUsersTable);
  await query(createUseCasesTable);
  await query(createPreferencesTable);
  await query(createAnalyticsTable);
  await query(createFeedbacksTable);

  // Automated migration: Drop obsolete verification checkpoints table
  try {
    await query('DROP TABLE IF EXISTS verification_checkpoints;');
    console.log('🔄 Schema migration: Dropped obsolete "verification_checkpoints" table.');
  } catch (err) {
    // Ignore error if already dropped
  }

  // Dynamic schema migrations for existing databases
  try {
    if (dbType === 'postgres') {
      await query('ALTER TABLE use_cases ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;');
    } else {
      await query('ALTER TABLE use_cases ADD COLUMN is_verified INTEGER DEFAULT 0;');
    }
    console.log('🔄 Schema migration: Added "is_verified" column to "use_cases" table.');
  } catch (err) {
    // Column already exists, safe to ignore
  }

  try {
    if (dbType === 'postgres') {
      await query('ALTER TABLE use_cases ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    } else {
      await query('ALTER TABLE use_cases ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;');
    }
    console.log('🔄 Schema migration: Added "updated_at" column to "use_cases" table.');
  } catch (err) {
    // Column already exists, safe to ignore
  }

  // New columns: per-user Gemini Enterprise app link, per-use-case infographic + main prompt type
  const columnMigrations = [
    { table: 'users', column: 'ge_app_link', pg: 'VARCHAR(1024)', sqlite: 'TEXT' },
    { table: 'use_cases', column: 'infographic_url', pg: 'VARCHAR(1024)', sqlite: 'TEXT' },
    // 'general' | 'notebooklm' | 'deep_research' | 'agent_designer' | 'canvas' | 'image' | 'video'
    { table: 'use_cases', column: 'prompt_type', pg: "VARCHAR(50) DEFAULT 'general'", sqlite: "TEXT DEFAULT 'general'" }
  ];
  for (const m of columnMigrations) {
    try {
      await query(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${dbType === 'postgres' ? m.pg : m.sqlite};`);
      console.log(`🔄 Schema migration: Added "${m.column}" column to "${m.table}" table.`);
    } catch (err) {
      // Column already exists, safe to ignore
    }
  }

  // DB-managed admins (invited by super admins), one-time auth tokens, and app-wide settings (e.g. SMTP)
  const createAdminsTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS admins (
      email VARCHAR(255) PRIMARY KEY,
      password_hash VARCHAR(255),          -- NULL until verified
      role VARCHAR(20) NOT NULL CHECK (role IN ('super','assist')),
      is_verified INTEGER DEFAULT 0,
      invited_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS admins (
      email TEXT PRIMARY KEY,
      password_hash TEXT,
      role TEXT NOT NULL CHECK (role IN ('super','assist')),
      is_verified INTEGER DEFAULT 0,
      invited_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createAuthTokensTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS auth_tokens (
      token_hash VARCHAR(64) PRIMARY KEY,  -- sha256 of a 32-byte random token; the raw token only lives in the email link
      email VARCHAR(255) NOT NULL,
      purpose VARCHAR(20) NOT NULL,        -- 'verify' | 'reset'
      expires_at TIMESTAMPTZ NOT NULL,     -- verify: 48h, reset: 1h
      used_at TIMESTAMPTZ
    );
  ` : `
    CREATE TABLE IF NOT EXISTS auth_tokens (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME
    );
  `;

  const createAppSettingsTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(100) PRIMARY KEY,        -- e.g. 'smtp'
      value TEXT NOT NULL,                 -- JSON; secret fields stored encrypted (see lib/secrets.js)
      updated_by VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_by TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await query(createAdminsTable);
  await query(createAuthTokensTable);
  await query(createAppSettingsTable);

  console.log('✅ All database tables verified / created.');
  await seedDatabase();
}

// ==========================================
// 2. Sandboxed JS VM Seeding Logic
// ==========================================
async function seedDatabase() {
  const existingCases = await query('SELECT count(*) as count FROM use_cases');
  const count = parseInt(existingCases[0].count || existingCases[0]['count(*)'] || 0);

  try {
    const appJsPath = path.join(__dirname, 'app.js');
    if (!fs.existsSync(appJsPath)) {
      throw new Error('app.js file not found in directory root! Cannot seed.');
    }

    const appJsCode = fs.readFileSync(appJsPath, 'utf8');

    // Setup an isolated sandbox environment mirroring minimal browser APIs so app.js compiles smoothly
    const sandbox = {
      document: {
        addEventListener: () => {}
      },
      window: {},
      console: console,
      globalThis: null
    };
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);

    // Appending helper assignments so local consts write directly to globalThis
    const seedExtractScript = appJsCode + `
      ;
      globalThis.seed_useCasesDb = useCasesDb;
      globalThis.seed_useCasesTranslations = useCasesTranslations;
    `;

    vm.runInNewContext(seedExtractScript, sandbox);

    const useCases = sandbox.seed_useCasesDb;
    const translations = sandbox.seed_useCasesTranslations;

    if (!useCases || !translations) {
      throw new Error('Failed to extract useCasesDb or useCasesTranslations from sandbox context.');
    }

    console.log(`🌱 Synchronizing all ${useCases.length} simplified use cases from app.js...`);
    for (const uc of useCases) {
      // Upsert (not DELETE + INSERT) so infographic_url, prompt_type, is_verified and created_at survive every boot
      await upsertSeedUseCase(uc, translations[uc.id]);
    }
    await applySeedPromptTypes();
    await applySeedInfographics();
    console.log('✅ Use cases database synchronized successfully.');

    // Clean up any previously pre-seeded mock analytics data to reflect actual adoption metrics
    await query("DELETE FROM analytics WHERE user_email = 'academic_trial@edu.hk'");

    // Seed standard trial user demo-user@example.com with password ***REMOVED*** if missing
    const existingTestUser = await query('SELECT count(*) as count FROM users WHERE email = ?', ['demo-user@example.com']);
    const testUserCount = parseInt(existingTestUser[0].count || existingTestUser[0]['count(*)'] || 0);
    if (testUserCount === 0) {
      console.log('👤 Seeding default user: demo-user@example.com with password: ***REMOVED***');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('***REMOVED***', salt);
      await query(
        'INSERT INTO users (email, password_hash, is_temp_password, role, institution_level) VALUES (?, ?, ?, ?, ?)',
        ['demo-user@example.com', hash, dbType === 'postgres' ? false : 0, 'Lecturer', 'University & College']
      );
    }

    // Idempotent: give the trial user its Gemini Enterprise app link (never overwrites an admin edit)
    await query(
      "UPDATE users SET ge_app_link = ? WHERE email = ? AND (ge_app_link IS NULL OR ge_app_link = '')",
      [TEST_USER_GE_APP_LINK, 'demo-user@example.com']
    );

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
  }
}

/*
 * Intended Gemini Enterprise surface for each seeded use case's MAIN sample prompt, chosen by reading the prompt:
 *   - agent_designer : the prompt is an Agent persona / system instruction ("You are the … Agent", rules, guardrails)
 *   - notebooklm     : the prompt analyses uploaded sources (rubric, transcripts, receipts, evidence packs)
 *   - deep_research  : the prompt asks for web-scale research / multi-source synthesis
 *   - canvas         : the prompt drafts a long, editable document (lab guide, funding proposal)
 *   - general        : a self-contained query that works in the standard Gemini Enterprise chat
 * The UI shows "Try it" only for general | canvas | image | video (NotebookLM / Deep Research / Agent Designer → Copy only).
 * Applied on insert, whenever prompt_type is NULL, and once (marker `seed_prompt_types_v1`) to rows still on the
 * column default 'general'. After that, admin edits always win.
 */
const SEED_PROMPT_TYPES = Object.freeze({
  socratic_tutor: 'agent_designer',        // "You are the {{COURSE_CODE}} Coach…" tutor persona + rules
  rubric_grading: 'notebooklm',            // grade the attached essay against the uploaded rubric
  curriculum_design: 'deep_research',      // "Search the web for the top 5 most in-demand skills…"
  lab_manual_creator: 'canvas',            // long student-facing lab guide document
  su_advocacy: 'notebooklm',               // analyse uploaded town hall transcripts + survey comments
  club_funding: 'canvas',                  // draft a detailed funding proposal document
  su_helpdesk: 'agent_designer',           // 24/7 Policy and Welfare Agent instructions
  visual_campaign: 'general',              // storyline + text-to-image prompts in one chat answer
  at_risk_cohort: 'deep_research',         // multi-signal learning analytics synthesis
  accreditation_reports: 'notebooklm',     // cross-map provided syllabi / outcomes against standards
  workforce_federation: 'deep_research',   // IdP federation blueprint from vendor documentation research
  sao_scavenger_hunt: 'general',           // clues + trivia quiz generated in one chat answer
  finance_compliance: 'notebooklm',        // audit uploaded receipts against regulations
  security_simulator: 'agent_designer'     // interactive multi-branch drill simulation run as an Agent
});

const PROMPT_TYPES = Object.freeze(['general', 'notebooklm', 'deep_research', 'agent_designer', 'canvas', 'image', 'video']);
const TEST_USER_GE_APP_LINK = 'https://your-gemini-enterprise-app-link';

async function upsertSeedUseCase(uc, ucTranslations) {
  const translationsObj = ucTranslations || { en: uc, 'zh-TW': {}, 'zh-CN': {} };
  // Content columns are refreshed from app.js; prompt_type is only written on first insert.
  const upsertSql = `
    INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations, prompt_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      category = excluded.category, title = excluded.title, summary = excluded.summary,
      features = excluded.features, connectors = excluded.connectors, role = excluded.role,
      level = excluded.level, steps = excluded.steps, prompt = excluded.prompt,
      pro_tip = excluded.pro_tip, connector_guide = excluded.connector_guide, translations = excluded.translations
  `;

  const params = [
    uc.id,
    uc.category,
    uc.title,
    uc.summary,
    JSON.stringify(uc.features || []),
    JSON.stringify(uc.connectors || []),
    uc.role,
    JSON.stringify(uc.level || []),
    JSON.stringify(uc.steps || []),
    uc.prompt,
    uc.proTip || '',
    uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
    JSON.stringify(translationsObj),
    SEED_PROMPT_TYPES[uc.id] || 'general'
  ];

  await query(upsertSql, params);
}

// Fills prompt_type from SEED_PROMPT_TYPES where it is NULL, plus a one-time pass over rows on the 'general' default.
async function applySeedPromptTypes() {
  const entries = Object.entries(SEED_PROMPT_TYPES);
  for (const [id, type] of entries) {
    await query('UPDATE use_cases SET prompt_type = ? WHERE id = ? AND prompt_type IS NULL', [type, id]);
  }

  const marker = await mailer.readSetting(query, 'seed_prompt_types_v1');
  if (marker) return;
  for (const [id, type] of entries) {
    await query("UPDATE use_cases SET prompt_type = ? WHERE id = ? AND prompt_type = 'general'", [type, id]);
  }
  await mailer.writeSetting(query, 'seed_prompt_types_v1', { appliedAt: new Date().toISOString() }, 'system');
  console.log('🔄 Seed migration: Applied default prompt types to seeded use cases.');
}

/*
 * Infographics already generated with gemini-nano-banana-2.1 (v2: Archimedes mascot, cel-shaded editorial)
 * and stored in the public bucket. On boot every instance (local SQLite, dev/prod Postgres) picks these up,
 * so a fresh deploy shows images immediately without spending Vertex calls. See applySeedInfographics()
 * for exactly when an existing value is replaced.
 */
const INFOGRAPHIC_BASE = `https://storage.googleapis.com/${process.env.INFOGRAPHIC_BUCKET || 'your-infographic-bucket'}/infographics`;
const SEED_INFOGRAPHIC_VERSIONS = Object.freeze({
  accreditation_reports: 1791779876, at_risk_cohort: 1791779899, club_funding: 1791779917,
  curriculum_design: 1791780321, finance_compliance: 1791780221, lab_manual_creator: 1791779965,
  rubric_grading: 1791779983, sao_scavenger_hunt: 1791780013, security_simulator: 1791780025,
  socratic_tutor: 1791779825, su_advocacy: 1791780048, su_helpdesk: 1791780242,
  visual_campaign: 1791780081, workforce_federation: 1791780116
});

/*
 * applySeedInfographics(): decide per row whether to write the seed URL `${INFOGRAPHIC_BASE}/<id>.png?v=<seed>`.
 *   1. infographic_url is NULL / empty                       -> write the seed URL.
 *   2. infographic_url is the SAME bucket object (base path `.../infographics/<id>.png`, query ignored)
 *      and its numeric ?v= (upload epoch seconds) is smaller than the seed version, or missing/non-numeric
 *                                                            -> write the seed URL (upgrades old images).
 *   3. anything else (a newer admin regeneration with a larger ?v=, or a different URL) -> leave untouched.
 * Comparison is done in JS (select, compare, update) rather than in SQL so it behaves the same on SQLite and Postgres.
 */
async function applySeedInfographics() {
  const ids = Object.keys(SEED_INFOGRAPHIC_VERSIONS);
  const rows = await query('SELECT id, infographic_url FROM use_cases');

  // Split "<base>?v=<n>" into its object path and numeric version (NaN when absent / not a number).
  const parseUrl = (url) => {
    const [base, qs = ''] = String(url).split('?');
    const v = new URLSearchParams(qs).get('v');
    return { base, version: v !== null && /^\d+$/.test(v) ? Number(v) : NaN };
  };

  const shouldSeed = (id, current) => {
    if (!current) return true;                                   // rule 1
    const { base, version } = parseUrl(current);
    if (base !== `${INFOGRAPHIC_BASE}/${id}.png`) return false;  // rule 3: different object
    return !(version >= SEED_INFOGRAPHIC_VERSIONS[id]);          // rule 2 (NaN counts as older)
  };

  const targets = rows.filter(r => ids.includes(r.id) && shouldSeed(r.id, r.infographic_url));
  for (const { id } of targets) {
    await query('UPDATE use_cases SET infographic_url = ? WHERE id = ?',
      [`${INFOGRAPHIC_BASE}/${id}.png?v=${SEED_INFOGRAPHIC_VERSIONS[id]}`, id]);
  }
  if (targets.length) console.log(`🖼️  Seed infographics applied to ${targets.length} use case(s).`);
}

// Generate premium mock analytics trend lines for the last 6 months
async function seedAnalytics() {
  const existingLogs = await query('SELECT count(*) as count FROM analytics');
  const logCount = parseInt(existingLogs[0].count || existingLogs[0]['count(*)'] || 0);

  if (logCount > 0) return;

  console.log('📈 Seeding realistic monthly analytics logs for the last 6 months...');
  const actions = ['view', 'like', 'try'];
  const useCaseIds = ['socratic_tutor', 'rubric_grading', 'curriculum_design', 'lab_manual_creator', 'su_advocacy'];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Distribute events realistically: views > likes > tries
    const counts = { view: 60 + Math.floor(Math.random() * 50), like: 15 + Math.floor(Math.random() * 15), try: 5 + Math.floor(Math.random() * 8) };

    for (const act of actions) {
      const totalEvents = counts[act];
      for (let j = 0; j < totalEvents; j++) {
        // Randomize day within the target month
        const eventDay = 1 + Math.floor(Math.random() * 27);
        const eventDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), eventDay, 9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 59));
        
        const timestampStr = dbType === 'postgres' ? eventDate : eventDate.toISOString().replace('T', ' ').substring(0, 19);
        const ucId = useCaseIds[Math.floor(Math.random() * useCaseIds.length)];

        await query(
          'INSERT INTO analytics (timestamp, action, use_case_id, user_email) VALUES (?, ?, ?, ?)',
          [timestampStr, act, ucId, 'academic_trial@edu.hk']
        );
      }
    }
  }
  console.log('✅ Completed seeding historical analytics metrics.');
}

// ==========================================
// 3. User & Admin Authentication REST API
// ==========================================

const crypto = require('crypto');

// Hard-coded accounts are reserved identifiers and can never be invited as DB admins.
const BUILT_IN_ADMINS = Object.freeze(['edu_portal_s_admin', 'edu_portal_admin', 'demo-admin']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOKEN_TTL_MS = Object.freeze({ verify: 48 * 60 * 60 * 1000, reset: 60 * 60 * 1000 });
const MIN_ADMIN_PASSWORD = 8;
const FORGOT_PASSWORD_MESSAGE = 'If this is a verified admin email, a reset link is on its way. Otherwise, contact your portal admin.';

const normalizeEmail = (e) => String(e || '').trim().toLowerCase();
const isValidEmail = (e) => EMAIL_RE.test(e) && e.length <= 254;
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const isTruthyFlag = (v) => v === 1 || v === true || v === '1' || v === 'true';

// Session payload for any admin (hard-coded or DB). Super = edu_portal_s_admin or a DB admin with role 'super'.
const adminSession = (email, role, extra = {}) => ({
  email,
  isAdmin: true,
  isSuper: role === 'super',
  isAssist: role !== 'super',
  ...extra
});

// Older sessions (pre-upgrade) lack isSuper; derive it so the hard-coded super admin always qualifies.
const isSuperSession = (u) => Boolean(u && u.isAdmin && (u.isSuper || (u.email === 'edu_portal_s_admin' && !u.isAssist)));

// Validates an optional GE app link: empty clears it, otherwise it must be an absolute https:// URL.
const parseGeAppLink = (raw) => {
  const value = String(raw == null ? '' : raw).trim();
  if (!value) return { ok: true, value: null };
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || !u.hostname) return { ok: false };
    return { ok: true, value: value.slice(0, 1024) };
  } catch (err) {
    return { ok: false };
  }
};

// Link base for emails: PUBLIC_BASE_URL override, else the request's own origin (works on localhost, Cloud Run, custom domain).
const requestOrigin = (req) => {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
  return `${proto}://${host}`;
};

/**
 * issueAuthToken(email, purpose) -> raw token (only ever placed in the emailed link).
 * We store sha256(token), so a DB leak cannot be replayed. Older unused tokens for the same email+purpose
 * are invalidated first, so only the most recent link works.
 */
async function issueAuthToken(email, purpose) {
  const raw = crypto.randomBytes(32).toString('base64url');
  const nowIso = new Date().toISOString();
  await query('UPDATE auth_tokens SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL', [nowIso, email, purpose]);
  await query(
    'INSERT INTO auth_tokens (token_hash, email, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [sha256(raw), email, purpose, new Date(Date.now() + TOKEN_TTL_MS[purpose]).toISOString()]
  );
  return raw;
}

const roleLabel = (role) => (role === 'super' ? 'Super admin' : 'Assistant admin');

// Builds + sends the admin invitation (verify link, 48h). Returns mailer result {delivered, mode, previewLink?, error?}.
async function sendAdminInvite(req, email, role) {
  const token = await issueAuthToken(email, 'verify');
  const link = `${requestOrigin(req)}/?verify=${encodeURIComponent(token)}`;
  const text = `You've been invited as an ${roleLabel(role)} to Gemini Enterprise - Edu Portal.\n\nSet your password: ${link}\n\nThis link expires in 48 hours.`;
  const html = `<p>You've been invited as an <strong>${roleLabel(role)}</strong> to Gemini Enterprise - Edu Portal.</p>`
    + `<p><a href="${link}">Set your password</a></p><p style="color:#666">This link expires in 48 hours.</p>`;
  return mailer.sendMail(query, { to: email, subject: 'Your Edu Portal admin invitation', text, html, link });
}

// Login Handler
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || '***REMOVED***';
  const adminPassword = process.env.ADMIN_PASSWORD || '***REMOVED***';
  const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD || '***REMOVED***';

  // Admin bypass credentials
  if (email.trim() === 'edu_portal_s_admin' && password === superAdminPassword) {
    req.session.user = adminSession('edu_portal_s_admin', 'super');
    return res.json({ success: true, isAdmin: true, isSuper: true, isAssist: false });
  }

  // Admin Assist bypass credentials
  if (email.trim() === 'edu_portal_admin' && password === adminPassword) {
    req.session.user = adminSession('edu_portal_admin', 'assist');
    return res.json({ success: true, isAdmin: true, isSuper: false, isAssist: true });
  }

  // Demo Admin credentials (cloning edu_portal_admin permissions)
  if (email.trim() === 'demo-admin' && password === demoAdminPassword) {
    req.session.user = adminSession('demo-admin', 'assist');
    return res.json({ success: true, isAdmin: true, isSuper: false, isAssist: true });
  }

  // DB-managed admins (verified only). A wrong admin password falls through to the standard user check.
  try {
    const adminRows = await query('SELECT * FROM admins WHERE email = ? AND is_verified = 1', [normalizeEmail(email)]);
    const dbAdmin = adminRows[0];
    if (dbAdmin && dbAdmin.password_hash && await bcrypt.compare(password, dbAdmin.password_hash)) {
      req.session.user = adminSession(dbAdmin.email, dbAdmin.role, { isDbAdmin: true });
      return res.json({ success: true, isAdmin: true, isSuper: dbAdmin.role === 'super', isAssist: dbAdmin.role !== 'super', email: dbAdmin.email });
    }
  } catch (error) {
    console.error('Admin login lookup error:', error);
  }

  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email address not found. Please contact an admin.' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please try again.' });
    }

    const isTemp = user.is_temp_password === 1 || user.is_temp_password === true;

    // Save session credentials
    req.session.user = {
      email: user.email,
      isAdmin: false,
      isSuper: false,
      isAssist: false,
      isTemp: isTemp,
      role: user.role,
      institutionLevel: user.institution_level,
      geAppLink: user.ge_app_link || null
    };

    res.json({
      success: true,
      isAdmin: false,
      isSuper: false,
      isAssist: false,
      isTemp: isTemp,
      email: user.email,
      role: user.role,
      institutionLevel: user.institution_level,
      geAppLink: user.ge_app_link || null
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error encountered during authentication.' });
  }
});

// Force Password Reset or Profile Setup for Accounts
app.post('/api/auth/reset-password', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized session.' });
  }

  const { newPassword, role, institutionLevel } = req.body;

  try {
    const email = req.session.user.email;

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      await query(
        'UPDATE users SET password_hash = ?, is_temp_password = false, role = ?, institution_level = ? WHERE email = ?',
        [hash, role || null, institutionLevel || null, email]
      );
      req.session.user.isTemp = false;
    } else {
      // Profile context update only (no password change)
      await query(
        'UPDATE users SET role = ?, institution_level = ? WHERE email = ?',
        [role || null, institutionLevel || null, email]
      );
    }

    // Update active session metadata
    req.session.user.role = role || null;
    req.session.user.institutionLevel = institutionLevel || null;

    res.json({ success: true, role: role, institutionLevel: institutionLevel });
  } catch (error) {
    console.error('Password reset / profile setup error:', error);
    res.status(500).json({ success: false, message: 'Server database error during password reset / profile setup.' });
  }
});

// Get session state
// Re-reads ge_app_link (standard users) and role/existence (DB admins) so admin edits apply without re-login.
app.get('/api/auth/session', async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    return res.json({ success: false, loggedIn: false });
  }

  try {
    if (sessionUser.isAdmin && sessionUser.isDbAdmin) {
      const rows = await query('SELECT role FROM admins WHERE email = ? AND is_verified = 1', [sessionUser.email]);
      if (!rows.length) {
        // Admin was removed: end the session instead of leaving stale privileges behind
        return req.session.destroy(() => res.json({ success: false, loggedIn: false }));
      }
      req.session.user = adminSession(sessionUser.email, rows[0].role, { isDbAdmin: true });
    } else if (sessionUser.isAdmin) {
      req.session.user = { ...sessionUser, isSuper: isSuperSession(sessionUser), isAssist: !isSuperSession(sessionUser) };
    } else {
      const rows = await query('SELECT ge_app_link FROM users WHERE email = ?', [sessionUser.email]);
      req.session.user = { ...sessionUser, isSuper: false, isAssist: false, geAppLink: rows.length ? (rows[0].ge_app_link || null) : null };
    }
  } catch (error) {
    console.error('Session refresh error:', error);
  }

  res.json({ success: true, loggedIn: true, user: req.session.user });
});

/*
 * Forgot password (public). Only verified DB admins can reset by email; hard-coded accounts and standard users
 * are handled by their admins. The response is ALWAYS identical and returned before any email work happens,
 * so neither the body nor the timing reveals whether an account exists. The link is never sent to the browser;
 * in demo mode it is only logged on the server.
 */
app.post('/api/auth/forgot-password', (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  res.json({ success: true, message: FORGOT_PASSWORD_MESSAGE });

  if (!isValidEmail(email)) return;
  setImmediate(async () => {
    try {
      const rows = await query('SELECT email FROM admins WHERE email = ? AND is_verified = 1', [email]);
      if (!rows.length) return;
      const token = await issueAuthToken(email, 'reset');
      const link = `${requestOrigin(req)}/?reset=${encodeURIComponent(token)}`;
      await mailer.sendMail(query, {
        to: email,
        subject: 'Reset your Edu Portal password',
        text: `Reset your Gemini Enterprise - Edu Portal password: ${link}\n\nThis link expires in 1 hour. If you didn't ask for this, ignore this email.`,
        html: `<p><a href="${link}">Reset your Gemini Enterprise - Edu Portal password</a></p>`
          + `<p style="color:#666">This link expires in 1 hour. If you didn't ask for this, ignore this email.</p>`,
        link
      });
    } catch (error) {
      console.error('Forgot password processing error:', error);
    }
  });
});

/*
 * Complete a one-time token (verify invite or reset password) and sign the admin in.
 * Checks: sha256(token) exists, unused, unexpired, purpose-specific admin state. The "mark used" UPDATE is
 * conditional on used_at IS NULL, so two concurrent submissions of the same token can't both succeed.
 */
app.post('/api/auth/complete-token', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'This link is invalid or has expired.' });
  }
  if (!password || typeof password !== 'string' || password.length < MIN_ADMIN_PASSWORD) {
    return res.status(400).json({ success: false, message: `Password must be at least ${MIN_ADMIN_PASSWORD} characters.` });
  }

  try {
    const tokenHash = sha256(token.trim());
    const rows = await query('SELECT * FROM auth_tokens WHERE token_hash = ?', [tokenHash]);
    const record = rows[0];
    if (!record || record.used_at || new Date(record.expires_at).getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'This link is invalid or has expired.' });
    }

    const admins = await query('SELECT * FROM admins WHERE email = ?', [record.email]);
    const admin = admins[0];
    const purposeOk = admin && (record.purpose === 'verify' || (record.purpose === 'reset' && isTruthyFlag(admin.is_verified)));
    if (!purposeOk) {
      return res.status(400).json({ success: false, message: 'This link is invalid or has expired.' });
    }

    const nowIso = new Date().toISOString();
    const claim = await query(
      `UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL${dbType === 'postgres' ? ' RETURNING token_hash' : ''}`,
      [nowIso, tokenHash]
    );
    if (db.affectedRows(claim) !== 1) {
      return res.status(400).json({ success: false, message: 'This link is invalid or has expired.' });
    }

    const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await query('UPDATE admins SET password_hash = ?, is_verified = 1 WHERE email = ?', [hash, admin.email]);
    // Burn any other outstanding links for this admin + purpose
    await query('UPDATE auth_tokens SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL', [nowIso, admin.email, record.purpose]);

    req.session.user = adminSession(admin.email, admin.role, { isDbAdmin: true });
    res.json({
      success: true,
      purpose: record.purpose,
      email: admin.email,
      isAdmin: true,
      isSuper: admin.role === 'super',
      isAssist: admin.role !== 'super'
    });
  } catch (error) {
    console.error('Complete token error:', error);
    res.status(500).json({ success: false, message: 'Server error while completing this link.' });
  }
});

// Logout Handler
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ==========================================
// 4. Use Case Fetching and Interactive Action Routes
// ==========================================

// Get All Use Cases with individual User Preferences joined dynamically
app.get('/api/use-cases', async (req, res) => {
  try {
    const useCases = await query('SELECT * FROM use_cases ORDER BY id ASC');
    
    // Aggregated counts per use case: likes (current preference rows) and views (every modal open)
    const countMap = (rows) => Object.fromEntries(rows.map(r => [r.use_case_id, parseInt(r.cnt, 10) || 0]));
    const likesMap = countMap(await query('SELECT use_case_id, COUNT(*) as cnt FROM user_preferences WHERE is_liked = true GROUP BY use_case_id'));
    const viewsMap = countMap(await query("SELECT use_case_id, COUNT(*) as cnt FROM analytics WHERE action = 'view' GROUP BY use_case_id"));

    // Parse strings into Arrays/JSON
    const formattedUseCases = useCases.map(uc => {
      const transObj = JSON.parse(uc.translations || '{}');
      const enTrans = transObj.en || {};

      return {
        id: uc.id,
        category: uc.category,
        title: uc.title,
        summary: uc.summary,
        features: JSON.parse(uc.features || '[]'),
        connectors: JSON.parse(uc.connectors || '[]'),
        connectorEssential: (uc.connector_guide && JSON.parse(uc.connector_guide).connectorEssential !== undefined)
          ? JSON.parse(uc.connector_guide).connectorEssential
          : (uc.id === 'su_helpdesk' ? false : true),
        role: uc.role,
        level: JSON.parse(uc.level || '[]'),
        steps: JSON.parse(uc.steps || '[]'),
        prompt: uc.prompt,
        proTip: uc.pro_tip,
        connectorGuide: uc.connector_guide ? JSON.parse(uc.connector_guide) : null,
        translations: transObj,
        isVerified: uc.is_verified === true || uc.is_verified === 1 || uc.is_verified === 'true',
        infographicUrl: uc.infographic_url || null,
        promptType: PROMPT_TYPES.includes(uc.prompt_type) ? uc.prompt_type : 'general',
        isLiked: false,
        likeCount: likesMap[uc.id] || 0,
        totalLikes: likesMap[uc.id] || 0, // legacy alias of likeCount
        viewCount: viewsMap[uc.id] || 0,
        createdAt: uc.created_at,
        updatedAt: uc.updated_at
      };
    });

    // If an authorized standard user is logged in, fetch their specific preferences
    if (req.session.user && !req.session.user.isAdmin) {
      const email = req.session.user.email;
      const prefs = await query('SELECT use_case_id, is_liked FROM user_preferences WHERE user_email = ?', [email]);
      const likedIds = new Set(prefs.filter(p => p.is_liked === 1 || p.is_liked === true).map(p => p.use_case_id));
      formattedUseCases.forEach(uc => { uc.isLiked = likedIds.has(uc.id); });
    }

    res.json(formattedUseCases);
  } catch (error) {
    console.error('Error fetching use cases:', error);
    res.status(500).json({ error: 'Failed to retrieve use cases from server.' });
  }
});

/**
 * Guard for per-user preference writes. Distinguishes a missing/expired session (401,
 * code "session_expired") from an admin previewing the learning portal (403, code
 * "admin_preview") so the client can explain what happened instead of failing silently.
 */
const requireStandardUser = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, code: 'session_expired', message: 'Your session has expired. Sign in again.' });
  }
  if (req.session.user.isAdmin) {
    return res.status(403).json({ success: false, code: 'admin_preview', message: 'Admins cannot like playbooks.' });
  }
  next();
};

const countLikes = async (useCaseId) => {
  const rows = await query('SELECT COUNT(*) as cnt FROM user_preferences WHERE use_case_id = ? AND is_liked = true', [useCaseId]);
  return rows[0] ? parseInt(rows[0].cnt, 10) || 0 : 0;
};

// Toggle Like state (idempotent: the client sends the desired state, not a toggle)
app.post('/api/use-cases/like', requireStandardUser, async (req, res) => {
  const { useCaseId } = req.body || {};
  const isLiked = req.body?.isLiked === true || req.body?.isLiked === 'true' || req.body?.isLiked === 1;
  const email = req.session.user.email;
  if (!useCaseId) {
    return res.status(400).json({ success: false, message: 'useCaseId is required.' });
  }

  try {
    // Upsert the preference row; `excluded` is valid in both SQLite and PostgreSQL
    await query(`
      INSERT INTO user_preferences (user_email, use_case_id, is_liked)
      VALUES (?, ?, ?)
      ON CONFLICT (user_email, use_case_id)
      DO UPDATE SET is_liked = excluded.is_liked
    `, [email, useCaseId, dbType === 'sqlite' ? (isLiked ? 1 : 0) : isLiked]);

    // Insert an analytics event tracking log
    await query(
      'INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)',
      [isLiked ? 'like' : 'unlike', useCaseId, email]
    );

    const likeCount = await countLikes(useCaseId);
    res.json({ success: true, isLiked, likeCount, totalLikes: likeCount });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ success: false, message: 'Database query error.' });
  }
});

// Record a view each time a use case card is enlarged (modal opened); returns the new total
app.post('/api/use-cases/view', async (req, res) => {
  const { useCaseId } = req.body || {};
  if (!useCaseId) {
    return res.status(400).json({ success: false, message: 'useCaseId is required.' });
  }
  const email = req.session.user ? req.session.user.email : 'anonymous';

  try {
    const id = String(useCaseId).slice(0, 100);
    await query(
      'INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)',
      ['view', id, email]
    );
    const rows = await query("SELECT COUNT(*) as cnt FROM analytics WHERE action = 'view' AND use_case_id = ?", [id]);
    res.json({ success: true, viewCount: rows[0] ? parseInt(rows[0].cnt, 10) || 0 : 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// "Try it" launches (prompt opened in the user's Gemini Enterprise app) — logged as a 'try' analytics event
app.post('/api/use-cases/try', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized session.' });
  }
  const { useCaseId } = req.body || {};
  if (!useCaseId) {
    return res.status(400).json({ success: false, message: 'useCaseId is required.' });
  }

  try {
    await query(
      'INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)',
      ['try', String(useCaseId).slice(0, 100), req.session.user.email]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// User Feedback submission and admin control
// ==========================================

// Submit Feedback
app.post('/api/feedbacks', async (req, res) => {
  try {
    const feedbackText = req.body.feedback_text;
    if (!feedbackText || !feedbackText.trim()) {
      return res.status(400).json({ error: 'Feedback text is mandatory.' });
    }
    const email = req.session.user ? req.session.user.email : 'anonymous';
    await query('INSERT INTO feedbacks (user_email, feedback_text) VALUES (?, ?)', [email, feedbackText.trim()]);
    res.json({ success: true, message: 'Feedback submitted successfully!' });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'Database error. Failed to save feedback.' });
  }
});

// List Feedbacks (Admin and Super-Admin)
app.get('/api/feedbacks', async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized access. Administrator role required.' });
    }
    const feedbacks = await query('SELECT * FROM feedbacks ORDER BY created_at DESC');
    res.json({ success: true, feedbacks });
  } catch (err) {
    console.error('List feedbacks error:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// Delete Feedback (Strictly Super-Admin ONLY)
app.post('/api/feedbacks/delete', async (req, res) => {
  try {
    if (!isSuperSession(req.session.user)) {
      return res.status(403).json({ error: 'Unauthorized access. Super-admin role required.' });
    }
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Feedback ID is required.' });
    }
    await query('DELETE FROM feedbacks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Feedback dismissed successfully.' });
  } catch (err) {
    console.error('Delete feedback error:', err);
    res.status(500).json({ error: 'Database error.' });
  }
});

// ==========================================
// 5. Admin Dashboard & User Management APIs
// ==========================================

// Guard middleware to block standard users
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
}

// Guard middleware for super-admin-only features (hard-coded edu_portal_s_admin or a DB admin with role 'super')
function requireSuper(req, res, next) {
  if (isSuperSession(req.session.user)) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
  }
}

// User CRUD: Fetch all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to manage user accounts.' });
  }

  try {
    const users = await query('SELECT email, is_temp_password, ge_app_link, created_at FROM users ORDER BY created_at DESC');
    const formattedUsers = users.map(u => ({
      email: u.email,
      isTemp: u.is_temp_password === 1 || u.is_temp_password === true,
      geAppLink: u.ge_app_link || null,
      createdAt: u.created_at
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User CRUD: Add / Provision User
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to manage user accounts.' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide at least one valid email address.' });
  }

  // Check if multiple emails are provided (separated by commas)
  const isMultiple = email.includes(',');
  const emailList = email
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0 && e.includes('@'));

  if (emailList.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide at least one valid email address.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);

    if (isMultiple) {
      // Multiple user provisioning with default password "ChangeMe"
      const defaultPassword = 'ChangeMe';
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      const tempFlag = dbType === 'postgres' ? true : 1;

      const results = {
        success: [],
        duplicates: [],
        errors: []
      };

      for (const singleEmail of emailList) {
        try {
          const checkUser = await query('SELECT * FROM users WHERE email = ?', [singleEmail]);
          if (checkUser.length > 0) {
            results.duplicates.push(singleEmail);
            continue;
          }

          await query(
            'INSERT INTO users (email, password_hash, is_temp_password) VALUES (?, ?, ?)',
            [singleEmail, passwordHash, tempFlag]
          );
          results.success.push(singleEmail);
        } catch (err) {
          console.error(`Error provisioning ${singleEmail}:`, err);
          results.errors.push(singleEmail);
        }
      }

      res.json({
        success: true,
        multiple: true,
        summary: results,
        defaultPassword: defaultPassword
      });

    } else {
      // Single email flow: retain existing logic with secure 10-char password generator
      const singleEmail = emailList[0];
      const checkUser = await query('SELECT * FROM users WHERE email = ?', [singleEmail]);
      if (checkUser.length > 0) {
        return res.status(400).json({ success: false, message: 'This email address is already provisioned.' });
      }

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let tempPassword = '';
      for (let i = 0; i < 10; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const passwordHash = await bcrypt.hash(tempPassword, salt);
      await query(
        'INSERT INTO users (email, password_hash, is_temp_password) VALUES (?, ?, ?)',
        [singleEmail, passwordHash, dbType === 'postgres' ? true : 1]
      );

      res.json({ success: true, multiple: false, email: singleEmail, tempPassword: tempPassword });
    }

  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: 'Failed to provision user due to backend database error.' });
  }
});

// User CRUD: Revoke / Delete User
app.delete('/api/admin/users', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to manage user accounts.' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please specify the email to revoke.' });
  }

  try {
    await query('DELETE FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User CRUD: Reset User password to a new temporary password (PUT, plus a POST alias used by the edit-user modal)
async function resetUserPasswordHandler(req, res) {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to manage user accounts.' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please specify an email address.' });
  }

  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 10; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    await query(
      'UPDATE users SET password_hash = ?, is_temp_password = ? WHERE email = ?',
      [passwordHash, dbType === 'postgres' ? true : 1, email.trim().toLowerCase()]
    );

    res.json({ success: true, email: email.trim().toLowerCase(), tempPassword: tempPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
app.put('/api/admin/users/reset', requireAdmin, resetUserPasswordHandler);
app.post('/api/admin/users/reset', requireAdmin, resetUserPasswordHandler);

/*
 * User CRUD: Edit user { originalEmail, email, geAppLink } (super only).
 * An email change is done as copy -> re-point -> delete inside one transaction, because users.email is the PK and
 * user_preferences references it (SQLite never cascades updates; Postgres would reject updating a referenced key).
 * analytics + feedbacks carry the email as plain text, so they are re-pointed too.
 */
app.put('/api/admin/users', requireSuper, async (req, res) => {
  const originalEmail = normalizeEmail(req.body && req.body.originalEmail);
  const newEmail = normalizeEmail((req.body && req.body.email) || originalEmail);
  const link = parseGeAppLink(req.body && req.body.geAppLink);

  const errors = {};
  if (!originalEmail) errors.originalEmail = 'originalEmail is required.';
  if (!isValidEmail(newEmail)) errors.email = 'Enter a valid email address.';
  if (!link.ok) errors.geAppLink = 'GE app link must be a valid URL starting with https://';
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
  }

  try {
    const existing = await query('SELECT * FROM users WHERE email = ?', [originalEmail]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (newEmail !== originalEmail) {
      const clash = await query('SELECT email FROM users WHERE email = ?', [newEmail]);
      if (clash.length) {
        return res.status(409).json({ success: false, message: 'Another user already uses this email.', errors: { email: 'Another user already uses this email.' } });
      }

      await db.withTransaction(async (tx) => {
        await tx(`
          INSERT INTO users (email, password_hash, is_temp_password, role, institution_level, created_at, ge_app_link)
          SELECT ?, password_hash, is_temp_password, role, institution_level, created_at, ? FROM users WHERE email = ?
        `, [newEmail, link.value, originalEmail]);
        await tx('UPDATE user_preferences SET user_email = ? WHERE user_email = ?', [newEmail, originalEmail]);
        await tx('UPDATE analytics SET user_email = ? WHERE user_email = ?', [newEmail, originalEmail]);
        await tx('UPDATE feedbacks SET user_email = ? WHERE user_email = ?', [newEmail, originalEmail]);
        await tx('DELETE FROM users WHERE email = ?', [originalEmail]);
      });
    } else {
      await query('UPDATE users SET ge_app_link = ? WHERE email = ?', [link.value, originalEmail]);
    }

    const rows = await query('SELECT email, is_temp_password, ge_app_link, created_at FROM users WHERE email = ?', [newEmail]);
    const u = rows[0];
    res.json({
      success: true,
      user: {
        email: u.email,
        isTemp: u.is_temp_password === 1 || u.is_temp_password === true,
        geAppLink: u.ge_app_link || null,
        createdAt: u.created_at
      }
    });
  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

// ==========================================
// 5b. Admin accounts (super admins only)
// ==========================================

const formatAdmin = (a) => ({
  email: a.email,
  role: a.role,
  status: isTruthyFlag(a.is_verified) ? 'active' : 'pending',
  invitedBy: a.invited_by || null,
  createdAt: a.created_at
});

// Response fragment for an email attempt: previewLink only when the email did not go out (demo mode / failure).
const deliveryFields = (result) => ({
  delivered: Boolean(result.delivered),
  emailMode: result.mode,
  ...(result.delivered ? {} : { previewLink: result.previewLink || null }),
  ...(result.error ? { emailError: result.error } : {})
});

app.get('/api/admin/admins', requireSuper, async (req, res) => {
  try {
    const rows = await query('SELECT email, role, is_verified, invited_by, created_at FROM admins ORDER BY created_at DESC');
    res.json({ success: true, admins: rows.map(formatAdmin) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/admins', requireSuper, async (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  const role = req.body && req.body.role;

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }
  if (!['super', 'assist'].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be 'super' or 'assist'." });
  }
  if (BUILT_IN_ADMINS.includes(email)) {
    return res.status(400).json({ success: false, message: 'This account name is reserved.' });
  }

  try {
    const existing = await query('SELECT email FROM admins WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'This email is already an admin.' });
    }

    await query('INSERT INTO admins (email, role, is_verified, invited_by) VALUES (?, ?, 0, ?)', [email, role, req.session.user.email]);
    const delivery = await sendAdminInvite(req, email, role);
    const rows = await query('SELECT email, role, is_verified, invited_by, created_at FROM admins WHERE email = ?', [email]);
    res.json({ success: true, admin: formatAdmin(rows[0]), ...deliveryFields(delivery) });
  } catch (error) {
    console.error('Invite admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to invite admin.' });
  }
});

app.post('/api/admin/admins/resend', requireSuper, async (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  try {
    const rows = await query('SELECT * FROM admins WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }
    if (isTruthyFlag(rows[0].is_verified)) {
      return res.status(400).json({ success: false, message: 'This admin is already active. They can use Forgot password.' });
    }
    const delivery = await sendAdminInvite(req, email, rows[0].role);
    res.json({ success: true, admin: formatAdmin(rows[0]), ...deliveryFields(delivery) });
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend invite.' });
  }
});

app.delete('/api/admin/admins', requireSuper, async (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please specify the admin email.' });
  }
  if (email === normalizeEmail(req.session.user.email)) {
    return res.status(400).json({ success: false, message: "You can't remove your own admin account." });
  }
  try {
    await query('DELETE FROM auth_tokens WHERE email = ?', [email]);
    await query('DELETE FROM admins WHERE email = ?', [email]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analytics: Calculate 6-month historical dashboard stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const userCountRows = await query('SELECT count(*) as count FROM users');
    const totalUsers = parseInt(userCountRows[0].count || userCountRows[0]['count(*)'] || 0);

    const useCaseCountRows = await query('SELECT count(*) as count FROM use_cases');
    const totalUseCases = parseInt(useCaseCountRows[0].count || useCaseCountRows[0]['count(*)'] || 0);

    const likeRows = await query('SELECT count(*) as count FROM user_preferences WHERE is_liked = true');
    const totalLikes = parseInt(likeRows[0].count || likeRows[0]['count(*)'] || 0);

    // Views = every enlarged-card open (analytics 'view' events)
    const viewRows = await query("SELECT count(*) as count FROM analytics WHERE action = 'view'");
    const totalViews = parseInt(viewRows[0].count || viewRows[0]['count(*)'] || 0);

    // Retrieve aggregate logs grouped by Month for the last 6 months
    const historicalAnalytics = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const startStr = monthStart.toISOString().substring(0, 10) + ' 00:00:00';
      const endStr = monthEnd.toISOString().substring(0, 10) + ' 23:59:59';

      const monthLabel = monthStart.toLocaleString('default', { month: 'short' });

      // Run separate SQL aggregation for each month (SQLite / Postgres safe syntax)
      const viewQuery = await query('SELECT count(*) as count FROM analytics WHERE action = ? AND timestamp >= ? AND timestamp <= ?', ['view', startStr, endStr]);
      const likeQuery = await query('SELECT count(*) as count FROM analytics WHERE action = ? AND timestamp >= ? AND timestamp <= ?', ['like', startStr, endStr]);
      const tryQuery = await query('SELECT count(*) as count FROM analytics WHERE action = ? AND timestamp >= ? AND timestamp <= ?', ['try', startStr, endStr]);

      historicalAnalytics.push({
        month: monthLabel,
        views: parseInt(viewQuery[0].count || viewQuery[0]['count(*)'] || 0),
        likes: parseInt(likeQuery[0].count || likeQuery[0]['count(*)'] || 0),
        tries: parseInt(tryQuery[0].count || tryQuery[0]['count(*)'] || 0)
      });
    }

    // Total "Try it" launches across all time
    const tryTotalRows = await query("SELECT count(*) as count FROM analytics WHERE action = 'try'");
    const totalTries = parseInt(tryTotalRows[0].count || tryTotalRows[0]['count(*)'] || 0);

    // Fetch use cases with their total likes count
    const mostLikedRes = await query(`
      SELECT 
        uc.id, 
        uc.title, 
        uc.category, 
        uc.role,
        COALESCE(likes_tbl.cnt, 0) as likes_count
      FROM use_cases uc
      LEFT JOIN (
        SELECT use_case_id, COUNT(*) as cnt 
        FROM user_preferences 
        WHERE is_liked = true 
        GROUP BY use_case_id
      ) likes_tbl ON uc.id = likes_tbl.use_case_id
      ORDER BY likes_count DESC, uc.title ASC
      LIMIT 5
    `);

    res.json({
      totalUsers,
      totalUseCases,
      totalLikes,
      totalViews,
      totalTries,
      history: historicalAnalytics,
      mostLiked: mostLikedRes
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use Case CRUD: Add or Modify
app.post('/api/admin/use-cases', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to create or import playbooks.' });
  }

  const uc = req.body;
  if (!uc.id || !uc.title || !uc.category) {
    return res.status(400).json({ success: false, message: 'Missing required use case parameter fields.' });
  }
  if (uc.promptType !== undefined && uc.promptType !== null && !PROMPT_TYPES.includes(uc.promptType)) {
    return res.status(400).json({ success: false, message: `promptType must be one of: ${PROMPT_TYPES.join(', ')}.` });
  }

  try {
    const isVerifiedVal = dbType === 'postgres' ? (uc.isVerified ? true : false) : (uc.isVerified ? 1 : 0);
    // Imports from the export file may carry an existing infographic; only accept https URLs
    const importedInfographic = parseGeAppLink(uc.infographicUrl);

    const insertSql = `
      INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations, is_verified, prompt_type, infographic_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      uc.id,
      uc.category,
      uc.title,
      uc.summary,
      JSON.stringify(uc.features || []),
      JSON.stringify(uc.connectors || []),
      uc.role,
      JSON.stringify(uc.level || []),
      JSON.stringify(uc.steps || []),
      uc.prompt,
      uc.proTip || '',
      uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
      JSON.stringify(uc.translations || { en: uc, 'zh-TW': {}, 'zh-CN': {} }),
      isVerifiedVal,
      uc.promptType || 'general',
      importedInfographic.ok ? importedInfographic.value : null
    ];

    await query(insertSql, params);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Use Case CRUD: Update
app.put('/api/admin/use-cases', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to edit or replace playbooks.' });
  }

  const uc = req.body;
  if (!uc.id || !uc.title) {
    return res.status(400).json({ success: false, message: 'ID and Title are mandatory.' });
  }
  if (uc.promptType !== undefined && uc.promptType !== null && !PROMPT_TYPES.includes(uc.promptType)) {
    return res.status(400).json({ success: false, message: `promptType must be one of: ${PROMPT_TYPES.join(', ')}.` });
  }

  try {
    const isVerifiedVal = dbType === 'postgres' ? (uc.isVerified ? true : false) : (uc.isVerified ? 1 : 0);

    // prompt_type = COALESCE(?, prompt_type): omitting promptType keeps the stored value
    const updateSql = `
      UPDATE use_cases
      SET category = ?, title = ?, summary = ?, features = ?, connectors = ?, role = ?, level = ?, steps = ?, prompt = ?, pro_tip = ?, connector_guide = ?, translations = ?, is_verified = ?, prompt_type = COALESCE(?, prompt_type), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      uc.category,
      uc.title,
      uc.summary,
      JSON.stringify(uc.features || []),
      JSON.stringify(uc.connectors || []),
      uc.role,
      JSON.stringify(uc.level || []),
      JSON.stringify(uc.steps || []),
      uc.prompt,
      uc.proTip || '',
      uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
      JSON.stringify(uc.translations || {}),
      isVerifiedVal,
      uc.promptType || null,
      uc.id
    ];

    await query(updateSql, params);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Use Case CRUD: Delete / Revoke
app.delete('/api/admin/use-cases', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to delete playbooks.' });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Please specify the ID to delete.' });
  }

  try {
    await query('DELETE FROM use_cases WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Use Case CRUD: Export as full structured JSON configuration file
app.get('/api/admin/use-cases/export', requireAdmin, async (req, res) => {
  try {
    const useCases = await query('SELECT * FROM use_cases ORDER BY id ASC');
    const exportData = useCases.map(uc => ({
      id: uc.id,
      category: uc.category,
      title: uc.title,
      summary: uc.summary,
      features: JSON.parse(uc.features || '[]'),
      connectors: JSON.parse(uc.connectors || '[]'),
      role: uc.role,
      level: JSON.parse(uc.level || '[]'),
      steps: JSON.parse(uc.steps || '[]'),
      prompt: uc.prompt,
      proTip: uc.pro_tip,
      connectorGuide: uc.connector_guide ? JSON.parse(uc.connector_guide) : null,
      translations: JSON.parse(uc.translations || '{}'),
      infographicUrl: uc.infographic_url || null,
      promptType: PROMPT_TYPES.includes(uc.prompt_type) ? uc.prompt_type : 'general'
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ge_adoption_use_cases.json');
    res.send(JSON.stringify(exportData, null, 2));

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5c. Use case infographics (super admins only)
// ==========================================

// Generates one infographic (Vertex AI Nano Banana -> GCS) and stores its public URL on the use case.
async function generateInfographicFor(row) {
  const { url } = await infographics.generateAndUpload(row);
  await query('UPDATE use_cases SET infographic_url = ? WHERE id = ?', [url, row.id]);
  return url;
}

app.post('/api/admin/use-cases/:id/infographic', requireSuper, async (req, res) => {
  try {
    const rows = await query('SELECT id, title, summary, features, steps FROM use_cases WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Use case not found.' });
    }
    const infographicUrl = await generateInfographicFor(rows[0]);
    res.json({ success: true, id: rows[0].id, infographicUrl });
  } catch (error) {
    console.error(`Infographic generation failed for ${req.params.id}:`, error.message);
    res.status(502).json({ success: false, id: req.params.id, error: error.message });
  }
});

/*
 * Generates every missing infographic. Runs a small worker pool (INFOGRAPHIC_CONCURRENCY, default 2) so a full
 * backfill of ~14 images (~10–25s each) finishes well inside Cloud Run's request timeout while staying gentle on
 * image-model quota. Each worker pulls the next id from a shared cursor; results keep their original order.
 */
app.post('/api/admin/infographics/generate-missing', requireSuper, async (req, res) => {
  try {
    const rows = await query("SELECT id, title, summary, features, steps FROM use_cases WHERE infographic_url IS NULL OR infographic_url = '' ORDER BY id ASC");
    const concurrency = Math.max(1, Math.min(4, parseInt(process.env.INFOGRAPHIC_CONCURRENCY || '2', 10) || 2));
    const results = new Array(rows.length);
    let cursor = 0;

    const worker = async () => {
      while (cursor < rows.length) {
        const index = cursor++;
        const row = rows[index];
        try {
          results[index] = { id: row.id, success: true, infographicUrl: await generateInfographicFor(row) };
        } catch (error) {
          results[index] = { id: row.id, success: false, error: error.message };
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));

    const generated = results.filter(r => r.success).length;
    res.json({ success: true, total: rows.length, generated, failed: rows.length - generated, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5d. Settings → Email (SMTP), super admins only
// ==========================================

/*
 * Status pill logic:
 *   demo        -> no enabled saved config and no SMTP_* env bootstrap (links appear in admin UI + server log)
 *   connected   -> last test succeeded for exactly the active config (fingerprint match)
 *   failed      -> last test for the active config failed (error text included)
 *   not_tested  -> active config has never been tested in its current form
 */
async function smtpSettingsPayload() {
  const stored = await mailer.loadStoredSmtp(query);
  const { config, decryptFailed } = mailer.storedToConfig(stored);
  const active = await mailer.resolveSmtpConfig(query);
  const lastTest = await mailer.readSetting(query, mailer.SMTP_TEST_KEY);
  const test = lastTest && lastTest.value;
  const testMatches = Boolean(active && test && test.fingerprint === mailer.configFingerprint(active));

  const mode = !active ? 'demo' : (!testMatches ? 'not_tested' : (test.ok ? 'connected' : 'failed'));

  return {
    success: true,
    config: {
      host: config.host,
      port: config.port,
      security: config.security,
      user: config.user,
      hasPassword: Boolean(stored && stored.value && stored.value.passwordEnc),
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      enabled: config.enabled
    },
    status: {
      mode,
      source: active ? active.source : null,       // 'db' | 'env' | null
      host: active ? active.host : null,
      lastTestAt: testMatches ? test.at : null,
      lastTestError: testMatches && !test.ok ? test.error : null
    },
    passwordDecryptFailed: decryptFailed,          // true -> key rotated, ask the admin to re-enter the password
    updatedBy: stored ? stored.updatedBy : null,
    updatedAt: stored ? stored.updatedAt : null
  };
}

// Validates SMTP form input. Returns { ok, errors, value } — value.password is undefined when blank (keep current).
function validateSmtpInput(body) {
  const b = body || {};
  const errors = {};
  const enabled = Boolean(b.enabled);
  const host = String(b.host || '').trim();
  const port = parseInt(b.port, 10);
  const security = String(b.security || 'starttls').toLowerCase();
  const fromEmail = normalizeEmail(b.fromEmail);

  if (enabled && !host) errors.host = 'Server is required.';
  if (host && !/^[a-z0-9.-]+$/i.test(host)) errors.host = 'Enter a valid host name.';
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.port = 'Port must be between 1 and 65535.';
  if (!mailer.SECURITY_MODES.includes(security)) errors.security = 'Security must be starttls, ssl or none.';
  if ((enabled || fromEmail) && !isValidEmail(fromEmail)) errors.fromEmail = 'Enter a valid from address.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      host,
      port: Number.isInteger(port) ? port : 587,
      security,
      user: String(b.user || '').trim(),
      password: typeof b.password === 'string' && b.password.length ? b.password : undefined,
      fromName: String(b.fromName || '').trim().slice(0, 100),
      fromEmail,
      enabled
    }
  };
}

app.get('/api/admin/settings/smtp', requireSuper, async (req, res) => {
  try {
    res.json(await smtpSettingsPayload());
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/settings/smtp', requireSuper, async (req, res) => {
  const { ok, errors, value } = validateSmtpInput(req.body);
  if (!ok) {
    return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
  }

  try {
    const stored = await mailer.loadStoredSmtp(query);
    // Blank password keeps the stored ciphertext; the plaintext is never written to the DB
    const passwordEnc = value.password !== undefined
      ? encrypt(value.password)
      : ((stored && stored.value && stored.value.passwordEnc) || null);

    const { password, ...rest } = value;
    await mailer.writeSetting(query, mailer.SMTP_SETTINGS_KEY, { ...rest, passwordEnc }, req.session.user.email);
    mailer.resetTransportCache();
    res.json(await smtpSettingsPayload());
  } catch (error) {
    console.error('Save SMTP settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to save email settings.' });
  }
});

/*
 * Test email: uses the submitted (possibly unsaved) form values, or the saved config when the body has no host.
 * A blank password falls back to the saved one. Sends to `to` or, for email-shaped admin accounts, the admin's own
 * address. The result is stored with the config fingerprint so the status pill only shows it for that exact config.
 */
app.post('/api/admin/settings/smtp/test', requireSuper, async (req, res) => {
  try {
    const body = req.body || {};
    const stored = await mailer.loadStoredSmtp(query);
    const saved = mailer.storedToConfig(stored).config;

    let cfg;
    if (body.host) {
      const { ok, errors, value } = validateSmtpInput({ ...body, enabled: true, fromEmail: body.fromEmail || body.user });
      if (!ok) {
        return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
      }
      cfg = { ...value, password: value.password !== undefined ? value.password : saved.password };
    } else {
      cfg = (await mailer.resolveSmtpConfig(query)) || null;
      if (!cfg) {
        return res.status(400).json({ success: false, message: 'No email server is configured yet.' });
      }
    }

    const sessionEmail = normalizeEmail(req.session.user.email);
    const to = normalizeEmail(body.to) || (isValidEmail(sessionEmail) ? sessionEmail : '');
    if (!isValidEmail(to)) {
      return res.status(400).json({ success: false, message: 'Enter an address to send the test email to.', errors: { to: 'Enter an address to send the test email to.' } });
    }

    const result = await mailer.testSmtpConfig(cfg, to);
    const at = new Date().toISOString();
    await mailer.writeSetting(query, mailer.SMTP_TEST_KEY, {
      ok: result.ok,
      at,
      error: result.ok ? null : result.error,
      fingerprint: mailer.configFingerprint(cfg)
    }, req.session.user.email);

    res.json({ success: true, ok: result.ok, to, testedAt: at, ...(result.ok ? {} : { error: result.error }) });
  } catch (error) {
    console.error('SMTP test error:', error);
    res.status(500).json({ success: false, message: 'Failed to run the email test.' });
  }
});

// Admin-Gemini: Optimize or Draft Playbooks with Gemini 3.5 Flash using Service Account Access
app.post('/api/admin/generate-gemini', requireAdmin, async (req, res) => {
  const { id, title, category, features, connectors, role, level, instruction } = req.body;
  if (!title && (!instruction || instruction.trim().length === 0)) {
    return res.status(400).json({ success: false, message: 'Please specify either a playbook title or custom instructions so Gemini can draft relevant content.' });
  }

  try {
    let originalCaseText = '';
    if (id) {
      const existing = await query('SELECT * FROM use_cases WHERE id = ?', [id]);
      if (existing && existing.length > 0) {
        const uc = existing[0];
        const originalTranslations = JSON.parse(uc.translations || '{}');
        originalCaseText = JSON.stringify({
          id: uc.id,
          category: uc.category,
          title: uc.title,
          summary: uc.summary,
          features: JSON.parse(uc.features || '[]'),
          connectors: JSON.parse(uc.connectors || '[]'),
          role: uc.role,
          level: JSON.parse(uc.level || '[]'),
          steps: JSON.parse(uc.steps || '[]'),
          prompt: uc.prompt,
          proTip: uc.pro_tip,
          translations: originalTranslations
        }, null, 2);
      }
    }

    const url = 'https://aiplatform.googleapis.com/v1/projects/your-gcp-project-id/locations/global/publishers/google/models/gemini-3.5-flash:generateContent';

    let promptText = `
You are the AI Playbook Architect for "Gemini Enterprise - Edu Portal".
Generate a high-fidelity educational/operational playbook based on the following input parameters:
- Playbook Title: "${title || 'Suggest a professional, high-fidelity playbook title based on instructions'}"
- Category: "${category || 'academic'}"
- Gemini Features: ${JSON.stringify(features || [])} (You may update or add features based on custom instructions)
- Connected Data Connectors: ${JSON.stringify(connectors || [])} (You may update or add connectors based on custom instructions)
- Target User Role: "${role || 'Lecturer'}"
- Target Institutional Levels: ${JSON.stringify(level || [])}
`;

    if (originalCaseText) {
      promptText += `
- EXISTING PLAYBOOK DETAILS (ORIGINAL DATA to refine):
${originalCaseText}

CRITICAL DIRECTIVE ON CASE INTEGRITY AND SELECTIVE REFINEMENT:
The user is editing/refining an existing playbook. You MUST respect and maintain the structural integrity, core flow, steps, and prompts of this original playbook.
Do NOT rewrite or alter any parts of the original playbook that are unrelated to the user's custom instructions/comments.
ONLY apply precise modifications, updates, or additions that directly address the custom instructions inside: "${instruction ? instruction.trim() : ''}".
Retain, preserve, and echo back all other original aspects, text blocks, titles, summaries, steps, and translation values.
`;
    } else if (instruction && instruction.trim().length > 0) {
      promptText += `
- SPECIAL USER CUSTOM DRAFTING INSTRUCTIONS:
"${instruction.trim()}"
Please fully implement, customize, and prioritize these instructions above. Focus your generated titles, summaries, prompts, steps, and tips on satisfying this instruction.
`;
    }

    promptText += `

Please output a raw JSON object containing full translation profiles for English ("en"), Traditional Chinese ("zh-TW"), and Simplified Chinese ("zh-CN").

CRITICAL INSTRUCTION ON LANGUAGE CONSISTENCY:
1. First, focus entirely on drafting the high-fidelity, comprehensive English profile ("en") based on the input parameters and custom instructions.
2. Once the English profile ("en") is finalized, translate every single field and list item exactly 1-to-1 (preserving the exact meaning, paragraph layout, number of steps, tips, and guidelines) into Traditional Chinese ("zh-TW") and Simplified Chinese ("zh-CN").
3. All translation profiles ("en", "zh-TW", "zh-CN") MUST be 100% semantically and structurally consistent (e.g. have the exact same step-by-step logic, features used, and pro-tips, just properly localized).

The JSON object MUST EXACTLY follow this schema:
{
  "id": "suggested_lowercase_kebab_case_id_matching_the_title",
  "category": "academic",
  "role": "Lecturer",
  "features": ["NotebookLM", "Canvas Mode", "Deep Research", "Agent Designer", "Image Generation", "Video Generation"], // Choose recommended features based on instructions and input
  "connectors": ["Drive Connector", "Email Connector", "LMS Connector", "Calendar Connector"], // Choose recommended connectors based on instructions and input, use product-agnostic naming exactly!
  "en": {
    "title": "Suggested High-Fidelity English Title",
    "summary": "Detailed summary describing how this playbook uses Gemini to solve the target challenge.",
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "prompt": "Highly detailed model prompt that the user can copy and paste into Gemini. Use dynamic variables in square brackets like [COURSE_NAME], [SUBJECT], [TOPIC], [TARGET_AUDIENCE] so users can fill in variables.",
    "proTip": "Helpful pro-tip for getting the best outcome from Gemini."
  },
  "zh-TW": {
    "title": "繁體中文版高質量標題",
    "summary": "繁體中文版詳細描述...",
    "steps": ["繁體中文步驟 1", "繁體中文步驟 2", "繁體中文步驟 3", "繁體中文步驟 4"],
    "prompt": "繁體中文詳細提示詞...請包含變數預留位置如 [課程名稱]、[主題] 等...",
    "proTip": "繁體中文實用技巧..."
  },
  "zh-CN": {
    "title": "简体中文版高质量标题",
    "summary": "简体中文版详细描述...",
    "steps": ["简体中文步骤 1", "简体中文步骤 2", "简体中文步骤 3", "简体中文步骤 4"],
    "prompt": "简体中文详细提示词...请包含变量预留位置如 [课程名称]、[主题] 等...",
    "proTip": "简体中文实用技巧..."
  }
}

Brand Guidelines & Localisation Boundaries:
1. Keep ALL product and feature names (e.g. "NotebookLM", "Gemini", "Canvas Mode", "Deep Research", "Agent Designer", "Image Generation", "Video Generation", "Drive Connector", "Email Connector", "Calendar Connector", "LMS Connector") strictly in ENGLISH, even inside the Traditional Chinese ("zh-TW") and Simplified Chinese ("zh-CN") translations.
2. Never use the term "Gem" (always use "Agent"). Never use the term "Copilot".
3. Avoid generic red/blue/green references. Ensure suggestions are premium and tailored for educational excellence.
4. DYNAMIC PROMPT VARIABLES: Prompts MUST use bracketed variables like [COURSE_NAME], [SUBJECT], [TOPIC], [TARGET_AUDIENCE] so users can fill them in interactively. Provide clean, simple, action-oriented operational steps.
5. Output ONLY the raw JSON block. Do NOT surround it with markdown code blocks (such as \`\`\`json ... \`\`\`), HTML tags, or any other introductory or concluding commentary text.

`;

    const response = await fetch(url, {
      method: 'POST',
      headers: await gcpHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        contents: {
          role: 'USER',
          parts: [{ text: promptText }]
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ success: false, error: `Gemini API returned error: ${errText}` });
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ success: false, error: 'Empty response returned from Gemini.' });
    }

    // Clean up markdown fences if Gemini returned them despite instructions
    text = text.trim();
    if (text.startsWith('```')) {
      const firstLineBreak = text.indexOf('\n');
      const lastFence = text.lastIndexOf('```');
      if (firstLineBreak !== -1 && lastFence > firstLineBreak) {
        text = text.substring(firstLineBreak + 1, lastFence).trim();
      }
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON. Raw response:', text);
      return res.status(500).json({ success: false, error: 'Failed to parse Gemini response as JSON. Please try again.', raw: text });
    }

    res.json({ success: true, result: parsedResult });
  } catch (error) {
    console.error('Gemini content generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 6. Init Database and Server Boot
// ==========================================
initializeSchemas().then(() => {
  app.listen(PORT, () => {
    console.log(`🤖 GE Adoption Server successfully active and listening on port http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database tables:', err);
});
