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
const { gcpHeaders, getProjectId } = require('./lib/gcp');
const mailer = require('./lib/mailer');
const { encrypt } = require('./lib/secrets');
const infographics = require('./lib/infographics');
const QuestCore = require('./lib/quest-core');
const CategoryCore = require('./lib/categories');
const { rankBySimilarity, shortlistForRerank } = require('./lib/similarity');
const IdeaQuality = require('./lib/idea-quality');
const { normalizeDraft, plainStepsForCase, FEATURES: FEATURE_NAMES } = require('./lib/draft-normalize');
// Research, Skills and Agent Designer chat / workflow playbooks seeded from lib/ (en + zh JSON), next to the app.js seeds
const SEED_PLAYBOOKS = require('./lib/seed-playbooks').buildSeedPlaybooks();
const { validateHelperPrompts, parseHelperPrompts } = require('./lib/helper-prompts');

/** Vertex AI model for admin drafting / translation. Override per environment with GEMINI_MODEL. */
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

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

// Quest Run sprite manifest: an empty object (200) when the asset build has not run, so the client
// silently falls back to code-drawn pixel art instead of logging a 404.
app.get('/game/manifest.json', (req, res) => {
  const file = path.join(__dirname, 'game', 'manifest.json');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.json({});
});

// Serve static assets from project root and public subdirectories (before sessions: no DB lookup per asset)
app.use(express.static(__dirname));

/*
 * Session signing secret. Comes from SESSION_SECRET (Secret Manager on Cloud Run). There is no hard-coded
 * fallback: without it we use a random per-process secret, which is fine locally but signs everyone out on
 * restart and breaks multi-instance deployments, hence the loud warning in production.
 */
const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
  const level = process.env.NODE_ENV === 'production' ? 'error' : 'warn';
  console[level]('⚠️  SESSION_SECRET is not set; using a random secret for this process. Set it in .env (see .env.example).');
  return require('crypto').randomBytes(32).toString('hex');
})();

// Express Session Management — stored in the DB (lib/session-store.js) so a session survives
// Cloud Run scale-to-zero, new revisions and multiple instances (MemoryStore lost them → 401s on likes).
app.use(session({
  store: createDbSessionStore(session, db),
  secret: SESSION_SECRET,
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
      is_verified BOOLEAN DEFAULT FALSE, -- DEPRECATED: use-case "Verified" badge removed; kept for backward compatibility
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
      is_verified INTEGER DEFAULT 0, -- DEPRECATED: use-case "Verified" badge removed; kept for backward compatibility
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
  // use_cases.is_verified is DEPRECATED (the use-case "Verified" badge/filter was removed): the column is still
  // created so older databases and exports stay compatible, but the API no longer reads, writes or returns it.
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
      // SQLite cannot ADD COLUMN with a non-constant default (CURRENT_TIMESTAMP), so add it bare and backfill
      await query('ALTER TABLE use_cases ADD COLUMN updated_at DATETIME;');
      await query('UPDATE use_cases SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;');
    }
    console.log('🔄 Schema migration: Added "updated_at" column to "use_cases" table.');
  } catch (err) {
    // Column already exists, safe to ignore
  }

  // New columns: per-user Gemini Enterprise app link, per-use-case infographic + main prompt type
  const columnMigrations = [
    { table: 'users', column: 'ge_app_link', pg: 'VARCHAR(1024)', sqlite: 'TEXT' },
    { table: 'use_cases', column: 'infographic_url', pg: 'VARCHAR(1024)', sqlite: 'TEXT' },
    // 'general' | 'notebooklm' | 'deep_research' | 'agent_designer' | 'skills' | 'canvas' | 'image' | 'video'
    { table: 'use_cases', column: 'prompt_type', pg: "VARCHAR(50) DEFAULT 'general'", sqlite: "TEXT DEFAULT 'general'" },
    // Quest Run: JSON array of academic phases when this playbook is most relevant (see lib/quest-core.js TIMINGS)
    { table: 'use_cases', column: 'timing', pg: `TEXT DEFAULT '["anytime"]'`, sqlite: `TEXT DEFAULT '["anytime"]'` },
    // Set up helper prompts: JSON { en: [{type,title,prompt}], 'zh-TW': [...], 'zh-CN': [...] }; NULL = never set
    { table: 'use_cases', column: 'helper_prompts', pg: 'TEXT', sqlite: 'TEXT' },
    // Audience categories (lib/categories.js ids), JSON array. users.categories decides which playbooks a user sees:
    // a playbook is visible when the two arrays intersect. NULL = not migrated yet (see applyCategoryMigration).
    { table: 'use_cases', column: 'categories', pg: 'TEXT', sqlite: 'TEXT' },
    { table: 'users', column: 'categories', pg: 'TEXT', sqlite: 'TEXT' },
    // Idea provider shown on the playbook ("Idea by …"); NULL = default playbook. Free text, usually an email.
    { table: 'use_cases', column: 'creator', pg: 'VARCHAR(255)', sqlite: 'TEXT' },
    // Feedback -> playbook conversion link (both directions)
    { table: 'use_cases', column: 'source_feedback_id', pg: 'INTEGER', sqlite: 'INTEGER' },
    { table: 'feedbacks', column: 'converted_use_case_id', pg: 'VARCHAR(100)', sqlite: 'TEXT' },
    { table: 'feedbacks', column: 'converted_at', pg: 'TIMESTAMP', sqlite: 'DATETIME' }
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

  // Quest Run: short "pain point" questions shown in the hero's speech bubble, linked to a playbook.
  // audience = JSON array of roles ('[]' = everyone); timing = JSON array or NULL (NULL inherits use_cases.timing).
  // No FK: SQLite runs with foreign keys off, so DELETE /api/admin/use-cases removes hints explicitly.
  const createQuestHintsTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS quest_hints (
      id SERIAL PRIMARY KEY,
      use_case_id VARCHAR(100) NOT NULL,
      question_en VARCHAR(255) NOT NULL,
      question_zh_tw VARCHAR(255),
      question_zh_cn VARCHAR(255),
      audience TEXT DEFAULT '[]',
      timing TEXT,
      active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS quest_hints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      use_case_id TEXT NOT NULL,
      question_en TEXT NOT NULL,
      question_zh_tw TEXT,
      question_zh_cn TEXT,
      audience TEXT DEFAULT '[]',
      timing TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Quest Run news: Archie delivers these as scrolls. starts_at / ends_at are 'YYYY-MM-DD' strings
  // compared against the viewer's LOCAL date on the client (inclusive range).
  const createAnnouncementsTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title_en VARCHAR(120) NOT NULL,
      title_zh_tw VARCHAR(120),
      title_zh_cn VARCHAR(120),
      body_en VARCHAR(300),
      body_zh_tw VARCHAR(300),
      body_zh_cn VARCHAR(300),
      link_url VARCHAR(1024),
      use_case_id VARCHAR(100),
      audience TEXT DEFAULT '[]',
      starts_at VARCHAR(10),
      ends_at VARCHAR(10),
      pinned INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_zh_tw TEXT,
      title_zh_cn TEXT,
      body_en TEXT,
      body_zh_tw TEXT,
      body_zh_cn TEXT,
      link_url TEXT,
      use_case_id TEXT,
      audience TEXT DEFAULT '[]',
      starts_at TEXT,
      ends_at TEXT,
      pinned INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await query(createQuestHintsTable);
  await query(createAnnouncementsTable);

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
      globalThis.seed_useCaseHelperPrompts = useCaseHelperPrompts;
    `;

    vm.runInNewContext(seedExtractScript, sandbox);

    const useCases = sandbox.seed_useCasesDb;
    const translations = sandbox.seed_useCasesTranslations;
    const helperPrompts = sandbox.seed_useCaseHelperPrompts || {};

    if (!useCases || !translations) {
      throw new Error('Failed to extract useCasesDb or useCasesTranslations from sandbox context.');
    }

    console.log(`🌱 Synchronizing all ${useCases.length} simplified use cases from app.js...`);
    for (const uc of useCases) {
      // Upsert (not DELETE + INSERT) so infographic_url, prompt_type and created_at survive every boot
      await upsertSeedUseCase(uc, translations[uc.id], helperPrompts[uc.id]);
    }
    for (const p of SEED_PLAYBOOKS) {
      await upsertSeedUseCase(p.uc, p.translations, p.helpers);
    }
    console.log(`🌱 Synchronized ${SEED_PLAYBOOKS.length} playbooks from lib/seed-playbooks.js.`);
    await applySeedPromptTypes();
    await applySeedV9Refresh();
    // Idempotent fix-up: the old admin form saved "admin"; the portal filters on "administrative"
    await query("UPDATE use_cases SET category = 'administrative' WHERE category = 'admin'");
    await applyProductRename();
    await applySeedInfographics();
    await applySeedTiming();
    await applySeedQuestHints();
    await applyCategoryMigration();
    console.log('✅ Use cases database synchronized successfully.');

    // Clean up any previously pre-seeded mock analytics data to reflect actual adoption metrics
    await query("DELETE FROM analytics WHERE user_email = 'academic_trial@edu.hk'");

    await seedDemoUser();

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
 * The UI shows "Try it" only for general | canvas | image | video (Gemini Notebook / Deep Research / Agent Designer → Copy only).
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
  visual_campaign: 'canvas',               // storyline + text-to-image prompts drafted as an editable Canvas document
  at_risk_cohort: 'deep_research',         // multi-signal learning analytics synthesis
  accreditation_reports: 'notebooklm',     // cross-map provided syllabi / outcomes against standards
  workforce_federation: 'deep_research',   // IdP federation blueprint from vendor documentation research
  sao_scavenger_hunt: 'canvas',            // clues + trivia quiz drafted as an editable Canvas document
  finance_compliance: 'notebooklm',        // audit uploaded receipts against regulations
  security_simulator: 'agent_designer',    // interactive multi-branch drill simulation run as an Agent
  // lib/seed-playbooks.js: research (notebooklm / canvas), Skills (skills), chat + workflow agents (agent_designer)
  ...Object.fromEntries(SEED_PLAYBOOKS.map(p => [p.id, p.promptType]))
});

/**
 * Product rename "NotebookLM" -> "Gemini Notebook" for rows already in the DB (admin-created playbooks,
 * quest questions, announcements). Seeded playbooks are rewritten from app.js anyway.
 * Idempotent: only rows still containing the old name are touched. REPLACE / LENGTH work in both SQLite
 * and PostgreSQL. Columns with a VARCHAR limit are skipped for a row if the longer name would not fit.
 * The prompt-type id 'notebooklm' is lowercase and unaffected (REPLACE is case-sensitive).
 */
const PRODUCT_RENAMES = Object.freeze([['NotebookLM', 'Gemini Notebook']]);
const RENAME_COLUMNS = Object.freeze([
  ['use_cases', ['title'], 255],
  ['use_cases', ['summary', 'features', 'steps', 'prompt', 'pro_tip', 'connector_guide', 'translations', 'helper_prompts'], null],
  ['quest_hints', ['question_en', 'question_zh_tw', 'question_zh_cn'], 255],
  ['announcements', ['title_en', 'title_zh_tw', 'title_zh_cn'], 120],
  ['announcements', ['body_en', 'body_zh_tw', 'body_zh_cn'], 300]
]);
async function applyProductRename() {
  for (const [from, to] of PRODUCT_RENAMES) {
    for (const [table, cols, maxLen] of RENAME_COLUMNS) {
      for (const col of cols) {
        const fits = maxLen ? ` AND LENGTH(REPLACE(${col}, ?, ?)) <= ${maxLen}` : '';
        const params = maxLen ? [from, to, `%${from}%`, from, to] : [from, to, `%${from}%`];
        try {
          await query(`UPDATE ${table} SET ${col} = REPLACE(${col}, ?, ?) WHERE ${col} LIKE ?${fits}`, params);
        } catch (err) {
          console.warn(`⚠️ Product rename skipped for ${table}.${col}: ${err.message}`);
        }
      }
    }
  }
}

const PROMPT_TYPES = Object.freeze(['general', 'notebooklm', 'deep_research', 'agent_designer', 'skills', 'canvas', 'image', 'video']);

/*
 * Optional demo / test user, created only when DEMO_USER_EMAIL and DEMO_USER_PASSWORD are set (.env or
 * Secret Manager). Nothing is created by default, so a fresh clone never ships a known login.
 * DEMO_USER_GE_APP_LINK (optional) fills the user's Gemini Enterprise app link without overwriting an admin edit.
 */
async function seedDemoUser() {
  const email = String(process.env.DEMO_USER_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEMO_USER_PASSWORD || '';
  if (!email || !password) return;

  const existing = await query('SELECT count(*) as count FROM users WHERE email = ?', [email]);
  if (parseInt(existing[0].count || existing[0]['count(*)'] || 0) === 0) {
    console.log(`👤 Seeding demo user from DEMO_USER_EMAIL: ${email}`);
    const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    await query(
      'INSERT INTO users (email, password_hash, is_temp_password, role, institution_level, categories) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, dbType === 'postgres' ? false : 0, 'Lecturer', 'University & College', JSON.stringify(['teaching'])]
    );
  }

  const link = String(process.env.DEMO_USER_GE_APP_LINK || '').trim();
  if (link) {
    await query(
      "UPDATE users SET ge_app_link = ? WHERE email = ? AND (ge_app_link IS NULL OR ge_app_link = '')",
      [link, email]
    );
  }
}

async function upsertSeedUseCase(uc, ucTranslations, ucHelpers) {
  const translationsObj = ucTranslations || { en: uc, 'zh-TW': {}, 'zh-CN': {} };
  // Seeded helper prompts go through the same validator as admin input; a seed without helpers stores '{}'
  const helperCheck = validateHelperPrompts(ucHelpers || {});
  // Content columns (helper prompts included) are refreshed from app.js; prompt_type and timing are only
  // written on first insert (timing here because the one-time seed_timing_v1 pass has already run on existing databases).
  const upsertSql = `
    INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations, prompt_type, timing, helper_prompts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET
      category = excluded.category, title = excluded.title, summary = excluded.summary,
      features = excluded.features, connectors = excluded.connectors, role = excluded.role,
      level = excluded.level, steps = excluded.steps, prompt = excluded.prompt,
      pro_tip = excluded.pro_tip, connector_guide = excluded.connector_guide, translations = excluded.translations,
      helper_prompts = excluded.helper_prompts
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
    SEED_PROMPT_TYPES[uc.id] || 'general',
    JSON.stringify((SEED_QUEST[uc.id] && SEED_QUEST[uc.id].timing) || ['anytime']),
    JSON.stringify(helperCheck.ok ? helperCheck.value : {})
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
  if (!marker) {
    for (const [id, type] of entries) {
      await query("UPDATE use_cases SET prompt_type = ? WHERE id = ? AND prompt_type = 'general'", [type, id]);
    }
    await mailer.writeSetting(query, 'seed_prompt_types_v1', { appliedAt: new Date().toISOString() }, 'system');
    console.log('🔄 Seed migration: Applied default prompt types to seeded use cases.');
  }

  // v2: these seeds moved general -> canvas once their prompts started ending with the Canvas sentence.
  // Only rows still on 'general' change, so an admin's deliberate choice is kept.
  const V2_CANVAS_IDS = ['sao_scavenger_hunt', 'visual_campaign'];
  if (await mailer.readSetting(query, 'seed_prompt_types_v2')) return;
  for (const id of V2_CANVAS_IDS) {
    await query("UPDATE use_cases SET prompt_type = 'canvas' WHERE id = ? AND prompt_type = 'general'", [id]);
  }
  await mailer.writeSetting(query, 'seed_prompt_types_v2', { appliedAt: new Date().toISOString() }, 'system');
  console.log('🔄 Seed migration: Moved Canvas-based seeded playbooks to the canvas prompt type.');
}

/*
 * Quest Run seed: when each playbook is most relevant in the academic year (timing) and the short
 * pain-point questions the hero asks (hints). Each hint: [en, zh-TW, zh-CN, audience roles, timing?]
 * — a hint timing of undefined inherits the use case timing. Every role ends up with ≥ 3 hints.
 */
const SEED_QUEST = Object.freeze({
  socratic_tutor: { timing: ['sem_start', 'midterm', 'finals'], hints: [
    ['Asking AI questions but not really learning?', '向 AI 發問，卻沒有真正學到東西？', '向 AI 提问，却没有真正学到东西？', ['Student']],
    ['Want students to find the answers themselves?', '想讓學生自己找到答案？', '想让学生自己找到答案？', ['Lecturer', 'TA']]
  ] },
  rubric_grading: { timing: ['midterm', 'finals'], hints: [
    ['Drowning in essays to mark?', '批改論文批改到喘不過氣？', '批改论文批改到喘不过气？', ['Lecturer', 'TA']],
    ['Want feedback that matches your rubric?', '想要與評分準則一致的回饋？', '想要与评分标准一致的反馈？', ['TA']]
  ] },
  curriculum_design: { timing: ['winter', 'summer'], hints: [
    ['Is your course still industry-ready?', '你的課程仍然貼近業界需要嗎？', '你的课程仍然贴近行业需求吗？', ['Lecturer', 'Program Leader']]
  ] },
  lab_manual_creator: { timing: ['sem_start'], hints: [
    ['Is your lab guide ready for week 1?', '第一週的實驗指引準備好了嗎？', '第一周的实验指引准备好了吗？', ['TA', 'Lecturer']]
  ] },
  su_advocacy: { timing: ['midterm', 'finals'], hints: [
    ['What are students really saying this term?', '學生這個學期真正在說甚麼？', '学生这个学期真正在说什么？', ['Student', 'Dean']]
  ] },
  club_funding: { timing: ['sem_start', 'summer'], hints: [
    ['Need a budget your club can defend?', '需要一份站得住腳的學會預算？', '需要一份站得住脚的社团预算？', ['Student']],
    ['Reviewing club budget requests?', '正在審批學會的預算申請？', '正在审批社团的预算申请？', ['Finance', 'SAO'], ['anytime']]
  ] },
  su_helpdesk: { timing: ['anytime'], hints: [
    ['Answering the same policy questions every day?', '每天都在回答同樣的政策問題？', '每天都在回答同样的政策问题？', ['Student', 'SAO']],
    ['Want a help desk that answers 24/7?', '想要一個全天候解答的服務台？', '想要一个全天候解答的服务台？', ['IT Admin']]
  ] },
  visual_campaign: { timing: ['sem_start', 'winter'], hints: [
    ['Need a campaign people actually notice?', '需要一個真正令人注意的宣傳活動？', '需要一个真正引人注意的宣传活动？', ['Student', 'SAO']],
    ['Need safety posters people will read?', '需要大家會細看的安全海報？', '需要大家会细看的安全海报？', ['Security'], ['anytime']]
  ] },
  at_risk_cohort: { timing: ['midterm'], hints: [
    ["Who's falling behind before finals?", '期末前，誰正在落後？', '期末前，谁正在掉队？', ['Dean', 'Program Leader', 'Lecturer']]
  ] },
  accreditation_reports: { timing: ['summer', 'winter'], hints: [
    ['Accreditation review coming up?', '評審即將到來？', '评审即将到来？', ['Program Leader', 'Dean']]
  ] },
  workforce_federation: { timing: ['summer', 'anytime'], hints: [
    ['Rolling out sign-in for new staff?', '正在為新同事設定登入？', '正在为新同事设置登录？', ['IT Admin']],
    ['Drowning in password reset tickets?', '密碼重設的請求多到處理不完？', '密码重置请求多到处理不完？', ['IT Admin'], ['anytime']]
  ] },
  sao_scavenger_hunt: { timing: ['winter', 'sem_start'], hints: [
    ['Planning an orientation or festival event?', '正在籌備迎新或節慶活動？', '正在筹备迎新或节庆活动？', ['SAO', 'Student']]
  ] },
  finance_compliance: { timing: ['finals', 'summer'], hints: [
    ['Year-end claims piling up?', '年終報銷單據堆積如山？', '年终报销单据堆积如山？', ['Finance']],
    ['Still checking receipts against policy by hand?', '仍在人手逐張核對收據？', '仍在手动逐张核对收据？', ['Finance'], ['anytime']]
  ] },
  security_simulator: { timing: ['sem_start'], hints: [
    ['Safety drill due this term?', '這個學期要進行安全演習？', '这个学期要进行安全演练？', ['Security']],
    ['Does your team know what to do in an emergency?', '你的團隊知道緊急時該怎樣做嗎？', '你的团队知道紧急时该怎么做吗？', ['Security', 'IT Admin'], ['anytime']]
  ] },
  ...Object.fromEntries(SEED_PLAYBOOKS.map(p => [p.id, p.quest]))
});

/** INSERT that resolves to the new row id on both dialects (pg needs RETURNING; sqlite reports lastID). */
async function insertReturningId(sql, params, run = query) {
  const result = await run(dbType === 'postgres' ? `${sql} RETURNING id` : sql, params);
  return dbType === 'postgres' ? result[0].id : result.lastID;
}

/*
 * One-time refresh (marker `seed_v9_refresh`) for seeds whose audience changed in v9. The scholarship workflow
 * became a staff-side screening workflow (student affairs + finance), so its categories, timing and Quest hints
 * are reset to the new seed values; applySeedQuestHints() then re-inserts the hints. Later admin edits win.
 */
const SEED_V9_RESET_IDS = Object.freeze(['scholarship_application_workflow']);
async function applySeedV9Refresh() {
  if (await mailer.readSetting(query, 'seed_v9_refresh')) return;
  for (const id of SEED_V9_RESET_IDS) {
    await query('UPDATE use_cases SET categories = ?, timing = ? WHERE id = ?',
      [JSON.stringify(SEED_CATEGORIES[id]), JSON.stringify(SEED_QUEST[id].timing), id]);
    await query('DELETE FROM quest_hints WHERE use_case_id = ?', [id]);
  }
  await mailer.writeSetting(query, 'seed_v9_refresh', { appliedAt: new Date().toISOString(), ids: SEED_V9_RESET_IDS }, 'system');
  console.log(`🔄 Seed migration: refreshed audience of ${SEED_V9_RESET_IDS.length} playbook(s) for v9.`);
}

// Timing: filled where NULL, plus a one-time pass (marker `seed_timing_v1`) over rows still on the
// '["anytime"]' column default. Admin edits made after that pass always win.
async function applySeedTiming() {
  const entries = Object.entries(SEED_QUEST).map(([id, q]) => [id, JSON.stringify(q.timing)]);
  for (const [id, timing] of entries) {
    await query('UPDATE use_cases SET timing = ? WHERE id = ? AND timing IS NULL', [timing, id]);
  }
  const marker = await mailer.readSetting(query, 'seed_timing_v1');
  if (marker) return;
  for (const [id, timing] of entries) {
    await query('UPDATE use_cases SET timing = ? WHERE id = ? AND timing = ?', [timing, id, '["anytime"]']);
  }
  await mailer.writeSetting(query, 'seed_timing_v1', { appliedAt: new Date().toISOString() }, 'system');
  console.log('🔄 Seed migration: Applied default Quest Run timing to seeded use cases.');
}

// Hints: inserted for a seeded use case only when it has none (so admin edits / deletions of
// individual hints persist, while a fresh database gets the full set).
async function applySeedQuestHints() {
  let inserted = 0;
  for (const [id, q] of Object.entries(SEED_QUEST)) {
    const exists = await query('SELECT id FROM use_cases WHERE id = ?', [id]);
    if (!exists.length) continue;
    const have = await query('SELECT count(*) as count FROM quest_hints WHERE use_case_id = ?', [id]);
    if (parseInt(have[0].count || have[0]['count(*)'] || 0) > 0) continue;
    for (const [en, zhTw, zhCn, audience, timing] of q.hints) {
      await query(
        'INSERT INTO quest_hints (use_case_id, question_en, question_zh_tw, question_zh_cn, audience, timing, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [id, en, zhTw, zhCn, JSON.stringify(audience), timing ? JSON.stringify(timing) : null]
      );
      inserted += 1;
    }
  }
  if (inserted) console.log(`🌱 Seeded ${inserted} Quest Run hints.`);
}

/*
 * Audience categories for the seeded playbooks (ids from lib/categories.js). Written only while a row's
 * categories column is NULL, so admin edits always win and the boot-time seed upsert never resets them.
 */
const SEED_CATEGORIES = Object.freeze({
  socratic_tutor: ['teaching', 'students'],
  rubric_grading: ['teaching'],
  curriculum_design: ['teaching', 'leadership'],
  lab_manual_creator: ['teaching'],
  su_advocacy: ['students', 'leadership'],
  club_funding: ['students', 'finance', 'student_affairs'],
  su_helpdesk: ['students', 'student_affairs'],
  visual_campaign: ['students', 'student_affairs'],
  at_risk_cohort: ['leadership', 'teaching'],
  accreditation_reports: ['leadership'],
  workforce_federation: ['it_admin'],
  sao_scavenger_hunt: ['student_affairs', 'students'],
  finance_compliance: ['finance'],
  security_simulator: ['security'],
  ...Object.fromEntries(SEED_PLAYBOOKS.map(p => [p.id, p.categories]))
});

/**
 * Pure: best-guess categories for a playbook that predates categories.
 * Union of (a) its legacy `role`, (b) every role named in its Quest hint audiences, then
 * (c) the legacy single `category` value as a last resort. Falls back to ['teaching'] so no
 * playbook silently disappears for everyone.
 */
const deriveCaseCategories = (row, hintAudiences) => {
  const roles = [row.role].concat(...hintAudiences.map(a => parseJsonArray(a)));
  const fromRoles = CategoryCore.normalizeCategories(roles.filter(Boolean));
  if (fromRoles.length) return fromRoles;
  const fromLegacy = CategoryCore.normalizeCategories([row.category]);
  return fromLegacy.length ? fromLegacy : ['teaching'];
};

/** Lenient JSON-array parse used for TEXT columns holding arrays. */
function parseJsonArray(text) {
  if (Array.isArray(text)) return text;
  try { const v = JSON.parse(text || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; }
}

/**
 * Idempotent backfill run on every boot (cheap: only touches rows whose categories is NULL):
 *   - use cases: SEED_CATEGORIES for seeds, deriveCaseCategories() for DB-only playbooks;
 *   - users: their legacy profile role mapped to a category (e.g. Lecturer -> teaching), or [] if none.
 */
async function applyCategoryMigration() {
  const cases = await query('SELECT id, role, category FROM use_cases WHERE categories IS NULL');
  for (const row of cases) {
    const hints = await query('SELECT audience FROM quest_hints WHERE use_case_id = ?', [row.id]);
    const cats = SEED_CATEGORIES[row.id] || deriveCaseCategories(row, hints.map(h => h.audience));
    await query('UPDATE use_cases SET categories = ? WHERE id = ?', [JSON.stringify(cats), row.id]);
  }
  const users = await query('SELECT email, role FROM users WHERE categories IS NULL');
  for (const u of users) {
    const cat = CategoryCore.categoryForRole(u.role);
    await query('UPDATE users SET categories = ? WHERE email = ?', [JSON.stringify(cat ? [cat] : []), u.email]);
  }
  if (cases.length || users.length) {
    console.log(`🔄 Category migration: ${cases.length} playbook(s), ${users.length} user(s) backfilled.`);
  }
}

/*
 * Infographics already generated with gemini-nano-banana-2.1 (v2: Archimedes mascot, cel-shaded editorial)
 * and stored in INFOGRAPHIC_BUCKET. When INFOGRAPHIC_SEED_IMAGES=true every instance picks these up on boot,
 * so a fresh deploy shows images immediately without spending Vertex calls. Leave it off for a new bucket
 * (the objects don't exist there yet) and generate them instead: Admin → Generate missing, or
 * `npm run infographics`. See applySeedInfographics() for exactly when an existing value is replaced.
 */
const INFOGRAPHIC_BASE = process.env.INFOGRAPHIC_BUCKET
  ? `https://storage.googleapis.com/${process.env.INFOGRAPHIC_BUCKET}/infographics`
  : '';
const SEED_INFOGRAPHIC_IMAGES = Boolean(INFOGRAPHIC_BASE) && process.env.INFOGRAPHIC_SEED_IMAGES === 'true';
const SEED_INFOGRAPHIC_VERSIONS = Object.freeze({
  accreditation_reports: 1791779876, at_risk_cohort: 1791779899, club_funding: 1791779917,
  curriculum_design: 1791780321, finance_compliance: 1791780221, lab_manual_creator: 1791779965,
  rubric_grading: 1791779983, sao_scavenger_hunt: 1791780013, security_simulator: 1791780025,
  socratic_tutor: 1791779825, su_advocacy: 1791780048, su_helpdesk: 1791780242,
  visual_campaign: 1791780081, workforce_federation: 1791780116,
  special_consideration_workflow: 1792321002, scholarship_application_workflow: 1793206632,
  // v9 (lib/seed-playbooks.js)
  research_literature_review: 1793206341, research_grant_proposal: 1793206378, research_ethics_precheck: 1793206413,
  skill_revision_quiz: 1793206432, skill_feedback_comments: 1793206457, skill_lesson_plan: 1793206489,
  skill_meeting_minutes: 1793206522, it_service_desk_agent: 1793206542,
  expense_claim_approval_workflow: 1793206561, exam_paper_moderation_workflow: 1793206598
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
  if (!SEED_INFOGRAPHIC_IMAGES) return;
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

/*
 * Built-in break-glass admin accounts. The password for each comes ONLY from its env var (Secret Manager on
 * Cloud Run, .env locally); nothing is hard-coded. An unset password disables the account, except the super
 * admin outside production: there a random password is generated once per process and printed to the console,
 * so a fresh clone can sign in without inventing credentials first.
 */
const BUILT_IN_ADMIN_ACCOUNTS = Object.freeze([
  { username: 'edu_portal_s_admin', role: 'super', env: 'SUPER_ADMIN_PASSWORD' },
  { username: 'edu_portal_admin', role: 'assist', env: 'ADMIN_PASSWORD' }
]);

// Built-in usernames are reserved identifiers and can never be invited as DB admins.
const BUILT_IN_ADMINS = Object.freeze(BUILT_IN_ADMIN_ACCOUNTS.map(a => a.username));

const builtInAdminPasswords = Object.freeze(Object.fromEntries(BUILT_IN_ADMIN_ACCOUNTS.map(({ username, role, env }) => {
  if (process.env[env]) return [username, process.env[env]];
  if (role === 'super' && process.env.NODE_ENV !== 'production') {
    const generated = crypto.randomBytes(9).toString('base64url');
    console.warn(`🔑 ${env} is not set. Local-only password for ${username} (this run): ${generated}`);
    return [username, generated];
  }
  console.warn(`🔒 ${env} is not set; built-in account ${username} is disabled.`);
  return [username, ''];
})));

// Constant-time comparison on equal-length digests, so response timing doesn't leak password prefixes.
const safeEqual = (a, b) => crypto.timingSafeEqual(
  crypto.createHash('sha256').update(String(a)).digest(),
  crypto.createHash('sha256').update(String(b)).digest()
);

// matchBuiltInAdmin(username, password) -> account | null. Disabled accounts (empty password) never match.
const matchBuiltInAdmin = (username, password) => {
  const account = BUILT_IN_ADMIN_ACCOUNTS.find(a => a.username === String(username || '').trim());
  const expected = account ? builtInAdminPasswords[account.username] : '';
  return expected && safeEqual(password, expected) ? account : null;
};

/*
 * Built-in account enable / disable state (super admins toggle it in the Admins tab).
 * Stored as app_settings['builtin_admins'] = { disabled: [username, ...] } so it survives deploys and is shared
 * by every Cloud Run instance. Reads are cached for BUILT_IN_STATE_TTL_MS: the guards below run on every admin
 * request, and another instance's toggle becomes visible here within that window. Writes refresh the cache.
 * Recovery if every super admin is locked out: DELETE FROM app_settings WHERE key = 'builtin_admins'.
 */
const BUILT_IN_STATE_KEY = 'builtin_admins';
const BUILT_IN_STATE_TTL_MS = 10 * 1000;
let builtInStateCache = { at: 0, disabled: new Set() };

const readDisabledBuiltIns = async ({ fresh = false } = {}) => {
  if (!fresh && Date.now() - builtInStateCache.at < BUILT_IN_STATE_TTL_MS) return builtInStateCache.disabled;
  const stored = await mailer.readSetting(query, BUILT_IN_STATE_KEY);
  const list = stored && stored.value && Array.isArray(stored.value.disabled) ? stored.value.disabled : [];
  const disabled = new Set(list.filter(u => BUILT_IN_ADMINS.includes(u)));
  builtInStateCache = { at: Date.now(), disabled };
  return disabled;
};

// 'not_configured' (no password env var) | 'disabled' (turned off by a super admin) | 'active'
const builtInStatus = (account, disabled) => {
  if (!builtInAdminPasswords[account.username]) return 'not_configured';
  return disabled.has(account.username) ? 'disabled' : 'active';
};

// True when the session belongs to a built-in account (DB admins may never use a built-in username).
const isBuiltInSession = (u) => Boolean(u && u.isAdmin && !u.isDbAdmin && BUILT_IN_ADMINS.includes(u.email));

/*
 * Active super admins = active built-in super accounts + verified DB admins with role 'super'.
 * `disabled` is the (possibly hypothetical) disabled set, and `excludeDbEmail` drops one DB admin, so callers can
 * ask "how many would remain after this change?" before applying it. The portal must always keep >= 1.
 */
const countActiveSupers = async (disabled, excludeDbEmail = null) => {
  const builtIn = BUILT_IN_ADMIN_ACCOUNTS.filter(a => a.role === 'super' && builtInStatus(a, disabled) === 'active').length;
  const rows = await query("SELECT email FROM admins WHERE role = 'super' AND is_verified = 1");
  return builtIn + rows.filter(r => normalizeEmail(r.email) !== excludeDbEmail).length;
};

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

  // Built-in (break-glass) admin accounts; passwords only from env, disabled when unset (see BUILT_IN_ADMIN_ACCOUNTS)
  const builtIn = matchBuiltInAdmin(email, password);
  if (builtIn && (await readDisabledBuiltIns({ fresh: true })).has(builtIn.username)) {
    return res.status(403).json({ success: false, message: 'This default admin account has been disabled by a super admin.' });
  }
  if (builtIn) {
    req.session.user = adminSession(builtIn.username, builtIn.role);
    const isSuper = builtIn.role === 'super';
    return res.json({ success: true, isAdmin: true, isSuper, isAssist: !isSuper });
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

    // Save session credentials (categories decide which playbooks the user sees; role/level are legacy)
    req.session.user = {
      email: user.email,
      isAdmin: false,
      isSuper: false,
      isAssist: false,
      isTemp: isTemp,
      role: user.role,
      institutionLevel: user.institution_level,
      categories: CategoryCore.normalizeCategories(user.categories),
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
      categories: req.session.user.categories,
      geAppLink: user.ge_app_link || null
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error encountered during authentication.' });
  }
});

// Forced password reset for accounts on a temporary password. The legacy role / institution-level profile
// step is gone (admins assign categories instead), so role / level are left untouched here.
app.post('/api/auth/reset-password', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized session.' });
  }

  const { newPassword } = req.body;

  try {
    const email = req.session.user.email;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await query(
      `UPDATE users SET password_hash = ?, is_temp_password = ${dbType === 'postgres' ? 'false' : '0'} WHERE email = ?`,
      [hash, email]
    );
    req.session.user.isTemp = false;

    res.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: 'Server database error during password reset.' });
  }
});

// Get session state
// Re-reads ge_app_link + categories (standard users) and role/existence (DB admins) so admin edits apply without re-login.
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
    } else if (isBuiltInSession(sessionUser) && (await readDisabledBuiltIns({ fresh: true })).has(sessionUser.email)) {
      return req.session.destroy(() => res.json({ success: false, loggedIn: false }));
    } else if (sessionUser.isAdmin) {
      req.session.user = { ...sessionUser, isSuper: isSuperSession(sessionUser), isAssist: !isSuperSession(sessionUser) };
    } else {
      const rows = await query('SELECT ge_app_link, categories FROM users WHERE email = ?', [sessionUser.email]);
      req.session.user = {
        ...sessionUser, isSuper: false, isAssist: false,
        geAppLink: rows.length ? (rows[0].ge_app_link || null) : null,
        categories: rows.length ? CategoryCore.normalizeCategories(rows[0].categories) : []
      };
    }
  } catch (error) {
    console.error('Session refresh error:', error);
  }

  let tourSeen = {};
  try { tourSeen = await readTourSeen(req.session.user.email); } catch (_) { /* tips simply show again */ }
  res.json({ success: true, loggedIn: true, user: req.session.user, tourSeen });
});

/*
 * First-login tips (overlay tour). One app_settings row per account, key `tour_seen:<email>`, value
 * { admin?: ISO date, user?: ISO date }. Works for built-in admins too (they have no users row).
 */
const TOUR_PORTALS = Object.freeze(['admin', 'user']);
const tourKey = (email) => `tour_seen:${String(email || '').toLowerCase()}`.slice(0, 100);
async function readTourSeen(email) {
  const setting = await mailer.readSetting(query, tourKey(email));
  const v = setting && setting.value && typeof setting.value === 'object' ? setting.value : {};
  return Object.fromEntries(TOUR_PORTALS.map(p => [p, Boolean(v[p])]));
}
app.post('/api/tour/seen', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ success: false, message: 'Not signed in.' });
  const portal = req.body && req.body.portal;
  if (!TOUR_PORTALS.includes(portal)) return res.status(400).json({ success: false, message: 'portal must be admin or user.' });
  try {
    const setting = await mailer.readSetting(query, tourKey(user.email));
    const value = { ...(setting && setting.value && typeof setting.value === 'object' ? setting.value : {}), [portal]: new Date().toISOString() };
    await mailer.writeSetting(query, tourKey(user.email), value, user.email);
    res.json({ success: true, tourSeen: await readTourSeen(user.email) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save.' });
  }
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

/** Current categories of a standard user account ([] when unknown). */
async function userCategories(email) {
  const rows = await query('SELECT categories FROM users WHERE email = ?', [email]);
  return rows.length ? CategoryCore.normalizeCategories(rows[0].categories) : [];
}

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
        infographicUrl: uc.infographic_url || null,
        promptType: PROMPT_TYPES.includes(uc.prompt_type) ? uc.prompt_type : 'general',
        timing: parseTiming(uc.timing),
        helperPrompts: parseHelperPrompts(uc.helper_prompts),
        categories: CategoryCore.normalizeCategories(uc.categories),
        creator: uc.creator || null, // null => "Default playbook"
        sourceFeedbackId: uc.source_feedback_id || null,
        isLiked: false,
        likeCount: likesMap[uc.id] || 0,
        totalLikes: likesMap[uc.id] || 0, // legacy alias of likeCount
        viewCount: viewsMap[uc.id] || 0,
        createdAt: uc.created_at,
        updatedAt: uc.updated_at
      };
    });

    // Standard users only receive the playbooks whose categories intersect their own (read fresh from the DB
    // so an admin's change applies on the next fetch). No categories assigned => an empty list.
    if (req.session.user && !req.session.user.isAdmin) {
      const email = req.session.user.email;
      const userCats = await userCategories(email);
      const visible = formattedUseCases.filter(uc => CategoryCore.isVisibleTo(uc.categories, userCats));
      const prefs = await query('SELECT use_case_id, is_liked FROM user_preferences WHERE user_email = ?', [email]);
      const likedIds = new Set(prefs.filter(p => p.is_liked === 1 || p.is_liked === true).map(p => p.use_case_id));
      visible.forEach(uc => { uc.isLiked = likedIds.has(uc.id); });
      return res.json(visible);
    }

    // Admins edit Quest Run hints inside the case form, so they get the full set per use case
    if (req.session.user && req.session.user.isAdmin) {
      const hintRows = await query('SELECT * FROM quest_hints ORDER BY id ASC');
      const byCase = hintRows.reduce((acc, h) => {
        (acc[h.use_case_id] = acc[h.use_case_id] || []).push(formatHintRow(h));
        return acc;
      }, {});
      formattedUseCases.forEach(uc => { uc.hints = byCase[uc.id] || []; });
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

// Submit Feedback. The idea-quality gate (lib/idea-quality.js, same rules the client checks first) rejects
// text that is too short or only generic praise, with a `code` the client turns into a localised hint.
app.post('/api/feedbacks', async (req, res) => {
  try {
    const feedbackText = typeof req.body.feedback_text === 'string' ? req.body.feedback_text : '';
    const gate = IdeaQuality.assessFeedback(feedbackText);
    if (!gate.ok) {
      const messages = {
        empty: 'Feedback text is mandatory.',
        too_long: `Feedback is limited to ${IdeaQuality.MAX_LENGTH} characters.`,
        too_short: 'Please add a little more detail so we can act on it.',
        too_vague: 'Please describe what you need: who it is for, the task, and what Gemini should produce.'
      };
      return res.status(400).json({ success: false, code: gate.code, error: messages[gate.code] });
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
    // Attach the title of the playbook each converted feedback became (or enhanced)
    const convertedIds = [...new Set(feedbacks.map(f => f.converted_use_case_id).filter(Boolean))];
    const titles = convertedIds.length
      ? Object.fromEntries((await query(`SELECT id, title FROM use_cases WHERE id IN (${convertedIds.map(() => '?').join(',')})`, convertedIds)).map(r => [r.id, r.title]))
      : {};
    feedbacks.forEach(f => { f.converted_use_case_title = f.converted_use_case_id ? (titles[f.converted_use_case_id] || null) : null; });
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
// Ends the session of a built-in admin that a super admin has since disabled. Resolves true when it was revoked.
const revokeIfDisabledBuiltIn = async (req, res) => {
  if (!isBuiltInSession(req.session.user)) return false;
  try {
    if (!(await readDisabledBuiltIns()).has(req.session.user.email)) return false;
  } catch (err) {
    console.error('Built-in admin state check failed:', err);
    return false;
  }
  req.session.destroy(() => res.status(401).json({ success: false, message: 'This admin account has been disabled.' }));
  return true;
};

async function requireAdmin(req, res, next) {
  if (!(req.session.user && req.session.user.isAdmin)) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  if (await revokeIfDisabledBuiltIn(req, res)) return;
  next();
}

// Guard middleware for super-admin-only features (hard-coded edu_portal_s_admin or a DB admin with role 'super')
async function requireSuper(req, res, next) {
  if (!isSuperSession(req.session.user)) {
    return res.status(403).json({ success: false, message: 'Access denied. Super admin privileges required.' });
  }
  if (await revokeIfDisabledBuiltIn(req, res)) return;
  next();
}

// User CRUD: Fetch all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to manage user accounts.' });
  }

  try {
    const users = await query('SELECT email, is_temp_password, ge_app_link, categories, created_at FROM users ORDER BY created_at DESC');
    const formattedUsers = users.map(formatUserRow);
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/** DB row -> admin API user shape. */
function formatUserRow(u) {
  return {
    email: u.email,
    isTemp: u.is_temp_password === 1 || u.is_temp_password === true,
    geAppLink: u.ge_app_link || null,
    categories: CategoryCore.normalizeCategories(u.categories),
    createdAt: u.created_at
  };
}

// User CRUD: Add / Provision User
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to manage user accounts.' });
  }

  const { email } = req.body;
  // Categories picked in the Add-users form apply to every email in this request ([] = sees no playbooks yet)
  const categoriesJson = JSON.stringify(CategoryCore.normalizeCategories(req.body.categories));
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
            'INSERT INTO users (email, password_hash, is_temp_password, categories) VALUES (?, ?, ?, ?)',
            [singleEmail, passwordHash, tempFlag, categoriesJson]
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
        'INSERT INTO users (email, password_hash, is_temp_password, categories) VALUES (?, ?, ?, ?)',
        [singleEmail, passwordHash, dbType === 'postgres' ? true : 1, categoriesJson]
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
 * User CRUD: Edit user { originalEmail, email, geAppLink, categories? } (super only).
 * An email change is done as copy -> re-point -> delete inside one transaction, because users.email is the PK and
 * user_preferences references it (SQLite never cascades updates; Postgres would reject updating a referenced key).
 * analytics + feedbacks carry the email as plain text, so they are re-pointed too.
 */
app.put('/api/admin/users', requireSuper, async (req, res) => {
  const originalEmail = normalizeEmail(req.body && req.body.originalEmail);
  const newEmail = normalizeEmail((req.body && req.body.email) || originalEmail);
  // geAppLink omitted = keep the stored link ('' or null clears it). Callers that only change categories
  // (tests, scripts) used to wipe the link because a missing field parsed as "clear".
  const linkGiven = req.body && req.body.geAppLink !== undefined;
  const link = parseGeAppLink(linkGiven ? req.body.geAppLink : null);

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
    const linkValue = linkGiven ? link.value : (existing[0].ge_app_link || null);

    if (newEmail !== originalEmail) {
      const clash = await query('SELECT email FROM users WHERE email = ?', [newEmail]);
      if (clash.length) {
        return res.status(409).json({ success: false, message: 'Another user already uses this email.', errors: { email: 'Another user already uses this email.' } });
      }

      await db.withTransaction(async (tx) => {
        await tx(`
          INSERT INTO users (email, password_hash, is_temp_password, role, institution_level, created_at, ge_app_link, categories)
          SELECT ?, password_hash, is_temp_password, role, institution_level, created_at, ?, categories FROM users WHERE email = ?
        `, [newEmail, linkValue, originalEmail]);
        await tx('UPDATE user_preferences SET user_email = ? WHERE user_email = ?', [newEmail, originalEmail]);
        await tx('UPDATE analytics SET user_email = ? WHERE user_email = ?', [newEmail, originalEmail]);
        await tx('UPDATE feedbacks SET user_email = ? WHERE user_email = ?', [newEmail, originalEmail]);
        // Playbooks credited to this account follow the rename
        await tx('UPDATE use_cases SET creator = ? WHERE creator = ?', [newEmail, originalEmail]);
        await tx('DELETE FROM users WHERE email = ?', [originalEmail]);
      });
    } else {
      await query('UPDATE users SET ge_app_link = ? WHERE email = ?', [linkValue, originalEmail]);
    }
    // categories is optional on this endpoint: omitted = unchanged, [] = clear (user then sees no playbooks)
    if (req.body && req.body.categories !== undefined) {
      await query('UPDATE users SET categories = ? WHERE email = ?',
        [JSON.stringify(CategoryCore.normalizeCategories(req.body.categories)), newEmail]);
    }

    const rows = await query('SELECT email, is_temp_password, ge_app_link, categories, created_at FROM users WHERE email = ?', [newEmail]);
    res.json({ success: true, user: formatUserRow(rows[0]) });
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

// Built-in account row for the Admins tab. isSelf hides the Disable button for the account you're signed in with.
const formatBuiltInAdmin = (a, disabled, sessionUser) => ({
  email: a.username,
  role: a.role,
  status: builtInStatus(a, disabled),
  builtIn: true,
  isSelf: isBuiltInSession(sessionUser) && sessionUser.email === a.username,
  invitedBy: null,
  createdAt: null
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
    const disabled = await readDisabledBuiltIns({ fresh: true });
    const builtIns = BUILT_IN_ADMIN_ACCOUNTS.map(a => formatBuiltInAdmin(a, disabled, req.session.user));
    res.json({ success: true, admins: [...builtIns, ...rows.map(formatAdmin)] });
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

/*
 * Enable / disable a built-in (default) admin. Rules:
 *  - the account must have a password configured (otherwise there is nothing to enable);
 *  - you can't disable the account you're signed in with;
 *  - disabling must leave at least one active super admin (built-in or verified DB super).
 * Enabling is always allowed.
 */
app.put('/api/admin/admins/builtin', requireSuper, async (req, res) => {
  const username = String((req.body && req.body.username) || '').trim();
  const disable = Boolean(req.body && req.body.disabled);
  const account = BUILT_IN_ADMIN_ACCOUNTS.find(a => a.username === username);
  if (!account) {
    return res.status(404).json({ success: false, message: 'Default admin account not found.' });
  }
  if (!builtInAdminPasswords[username]) {
    return res.status(400).json({ success: false, message: `This account has no password configured (${account.env}).` });
  }
  if (disable && isBuiltInSession(req.session.user) && req.session.user.email === username) {
    return res.status(400).json({ success: false, message: "You can't disable the account you're signed in with." });
  }
  try {
    const disabled = new Set(await readDisabledBuiltIns({ fresh: true }));
    if (disable) disabled.add(username); else disabled.delete(username);
    if (disable && account.role === 'super' && await countActiveSupers(disabled) < 1) {
      return res.status(400).json({ success: false, message: 'Keep at least one active super admin. Invite and activate another super admin first.' });
    }
    await mailer.writeSetting(query, BUILT_IN_STATE_KEY, { disabled: [...disabled] }, req.session.user.email);
    builtInStateCache = { at: Date.now(), disabled };
    res.json({ success: true, admin: formatBuiltInAdmin(account, disabled, req.session.user) });
  } catch (error) {
    console.error('Toggle built-in admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to update the admin account.' });
  }
});

app.delete('/api/admin/admins', requireSuper, async (req, res) => {
  const email = normalizeEmail(req.body && req.body.email);
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please specify the admin email.' });
  }
  if (BUILT_IN_ADMINS.includes(email)) {
    return res.status(400).json({ success: false, message: 'Default admin accounts can be disabled but not removed.' });
  }
  if (email === normalizeEmail(req.session.user.email)) {
    return res.status(400).json({ success: false, message: "You can't remove your own admin account." });
  }
  try {
    const target = (await query("SELECT role, is_verified FROM admins WHERE email = ?", [email]))[0];
    if (target && target.role === 'super' && isTruthyFlag(target.is_verified)
        && await countActiveSupers(await readDisabledBuiltIns({ fresh: true }), email) < 1) {
      return res.status(400).json({ success: false, message: 'Keep at least one active super admin. Enable a default super admin or activate another super admin first.' });
    }
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
        uc.categories,
        uc.creator,
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
      mostLiked: mostLikedRes.map(r => ({ ...r, categories: CategoryCore.normalizeCategories(r.categories), creator: r.creator || null }))
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use Case CRUD: Add or Modify

/**
 * Audience categories from a case payload. New clients send `categories`; legacy export files only have
 * `category` ('academic', …) and `role` ('Lecturer', …), which are mapped onto the new ids.
 */
const caseCategoriesFrom = (uc) => {
  const direct = CategoryCore.normalizeCategories(uc.categories);
  return direct.length ? direct : CategoryCore.normalizeCategories([uc.role, uc.category].filter(Boolean));
};

/** Creator input -> trimmed string (max 255) or null (= default playbook). */
const cleanCreator = (v) => {
  const s = String(v == null ? '' : v).trim().slice(0, 255);
  return s || null;
};

app.post('/api/admin/use-cases', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to create or import playbooks.' });
  }

  const uc = req.body;
  const categories = caseCategoriesFrom(uc || {});
  if (!uc.id || !uc.title) {
    return res.status(400).json({ success: false, message: 'Missing required use case parameter fields.' });
  }
  if (!categories.length) {
    return res.status(400).json({ success: false, message: 'Select at least one category.' });
  }
  if (uc.promptType !== undefined && uc.promptType !== null && !PROMPT_TYPES.includes(uc.promptType)) {
    return res.status(400).json({ success: false, message: `promptType must be one of: ${PROMPT_TYPES.join(', ')}.` });
  }
  const timingCheck = validateTimingInput(uc.timing);
  if (!timingCheck.ok) return res.status(400).json({ success: false, message: timingCheck.message });
  const hintsCheck = validateHintsInput(uc.hints);
  if (!hintsCheck.ok) return res.status(400).json({ success: false, message: hintsCheck.message });
  const helperCheck = validateHelperPrompts(uc.helperPrompts);
  if (!helperCheck.ok) return res.status(400).json({ success: false, message: helperCheck.message });

  try {
    // Imports from the export file may carry an existing infographic; only accept https URLs
    const importedInfographic = parseGeAppLink(uc.infographicUrl);

    const insertSql = `
      INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations, prompt_type, infographic_url, timing, helper_prompts, categories, creator, source_feedback_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const sourceFeedbackId = parseInt(uc.sourceFeedbackId, 10) || null;

    // Steps never keep {{VARIABLES}} (they are shown as-is, only prompts are substituted)
    const fixed = plainStepsForCase({
      steps: uc.steps || [],
      translations: uc.translations || { en: uc, 'zh-TW': {}, 'zh-CN': {} }
    });

    const params = [
      uc.id,
      // Legacy NOT NULL column: keep an old-style value when imported, otherwise the first category id
      uc.category || categories[0],
      uc.title,
      uc.summary,
      JSON.stringify(uc.features || []),
      JSON.stringify(uc.connectors || []),
      // Legacy NOT NULL column: the first role of the first category when the payload has no role
      uc.role || CategoryCore.rolesForCategories(categories)[0],
      JSON.stringify(uc.level || []),
      JSON.stringify(fixed.steps),
      uc.prompt,
      uc.proTip || '',
      uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
      JSON.stringify(fixed.translations),
      uc.promptType || 'general',
      importedInfographic.ok ? importedInfographic.value : null,
      JSON.stringify(timingCheck.value || ['anytime']),
      helperCheck.value ? JSON.stringify(helperCheck.value) : null,
      JSON.stringify(categories),
      cleanCreator(uc.creator),
      sourceFeedbackId
    ];

    await query(insertSql, params);
    if (hintsCheck.value) await replaceHints(uc.id, hintsCheck.value);
    if (sourceFeedbackId) await markFeedbackConverted(sourceFeedbackId, uc.id);
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
  const timingCheck = validateTimingInput(uc.timing);
  if (!timingCheck.ok) return res.status(400).json({ success: false, message: timingCheck.message });
  const hintsCheck = validateHintsInput(uc.hints);
  if (!hintsCheck.ok) return res.status(400).json({ success: false, message: hintsCheck.message });
  const helperCheck = validateHelperPrompts(uc.helperPrompts);
  if (!helperCheck.ok) return res.status(400).json({ success: false, message: helperCheck.message });

  try {
    // prompt_type / timing / helper_prompts / categories = COALESCE(?, column): omitting the field keeps the stored
    // value ({} clears helper prompts, because it is a non-NULL value). creator is only touched when the key is sent
    // (null / '' clears it back to "Default playbook"). category / role / level are legacy: kept unless sent.
    const categories = uc.categories !== undefined ? CategoryCore.normalizeCategories(uc.categories) : null;
    if (categories && !categories.length) {
      return res.status(400).json({ success: false, message: 'Select at least one category.' });
    }
    const creatorSent = Object.prototype.hasOwnProperty.call(uc, 'creator');
    const updateSql = `
      UPDATE use_cases
      SET category = COALESCE(?, category), title = ?, summary = ?, features = ?, connectors = ?, role = COALESCE(?, role), level = COALESCE(?, level), steps = ?, prompt = ?, pro_tip = ?, connector_guide = ?, translations = ?, prompt_type = COALESCE(?, prompt_type), timing = COALESCE(?, timing), helper_prompts = COALESCE(?, helper_prompts), categories = COALESCE(?, categories)${creatorSent ? ', creator = ?' : ''}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    // Steps never keep {{VARIABLES}} (they are shown as-is, only prompts are substituted)
    const fixed = plainStepsForCase({ steps: uc.steps || [], translations: uc.translations || {} });

    const params = [
      uc.category || null,
      uc.title,
      uc.summary,
      JSON.stringify(uc.features || []),
      JSON.stringify(uc.connectors || []),
      uc.role || null,
      uc.level ? JSON.stringify(uc.level) : null,
      JSON.stringify(fixed.steps),
      uc.prompt,
      uc.proTip || '',
      uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
      JSON.stringify(fixed.translations),
      uc.promptType || null,
      timingCheck.value ? JSON.stringify(timingCheck.value) : null,
      helperCheck.value ? JSON.stringify(helperCheck.value) : null,
      categories ? JSON.stringify(categories) : null,
      ...(creatorSent ? [cleanCreator(uc.creator)] : []),
      uc.id
    ];

    await query(updateSql, params);
    if (hintsCheck.value) await replaceHints(uc.id, hintsCheck.value);
    // "Enhance existing playbook" from a feedback: link the feedback to this playbook once saved
    const sourceFeedbackId = parseInt(uc.sourceFeedbackId, 10) || null;
    if (sourceFeedbackId) await markFeedbackConverted(sourceFeedbackId, uc.id);
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
    await query('DELETE FROM quest_hints WHERE use_case_id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Use Case CRUD: Export as full structured JSON configuration file
app.get('/api/admin/use-cases/export', requireAdmin, async (req, res) => {
  try {
    const useCases = await query('SELECT * FROM use_cases ORDER BY id ASC');
    const hintRows = await query('SELECT * FROM quest_hints ORDER BY id ASC');
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
      promptType: PROMPT_TYPES.includes(uc.prompt_type) ? uc.prompt_type : 'general',
      timing: parseTiming(uc.timing),
      helperPrompts: parseHelperPrompts(uc.helper_prompts),
      categories: CategoryCore.normalizeCategories(uc.categories),
      creator: uc.creator || null,
      hints: hintRows.filter(h => h.use_case_id === uc.id).map(formatHintRow)
        .map(({ question, audience, timing }) => ({ question, audience, timing }))
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ge_adoption_use_cases.json');
    res.send(JSON.stringify(exportData, null, 2));

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5b-2. Quest Run (hero strip hints, news, academic calendar)
// ==========================================

const QUEST_EVENT_ACTIONS = Object.freeze(['quest_view', 'quest_click', 'news_view', 'news_click']);
const CALENDAR_SETTING_KEY = 'academic_calendar';
const MAX_HINTS_PER_CASE = 5;

const safeJsonArray = (raw) => {
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
};

/** Stored timing JSON → valid TIMINGS array (never empty; defaults to ['anytime']). */
function parseTiming(raw) {
  const list = safeJsonArray(raw).filter(t => QuestCore.TIMINGS.includes(t));
  return list.length ? list : ['anytime'];
}

/** quest_hints row → API shape. `timing` is null when the hint inherits the use case timing. */
function formatHintRow(h) {
  return {
    id: h.id,
    useCaseId: h.use_case_id,
    question: { en: h.question_en || '', 'zh-TW': h.question_zh_tw || '', 'zh-CN': h.question_zh_cn || '' },
    audience: safeJsonArray(h.audience).filter(r => QuestCore.ROLES.includes(r)),
    timing: h.timing ? parseTiming(h.timing) : null,
    active: h.active === 1 || h.active === true
  };
}

/** Optional timing input: undefined/null → { ok, value: null } (keep stored); otherwise a validated array. */
function validateTimingInput(timing) {
  if (timing === undefined || timing === null) return { ok: true, value: null };
  if (!Array.isArray(timing) || !timing.length || !timing.every(t => QuestCore.TIMINGS.includes(t))) {
    return { ok: false, message: `timing must be a non-empty array of: ${QuestCore.TIMINGS.join(', ')}.` };
  }
  return { ok: true, value: [...new Set(timing)] };
}

/**
 * Optional hints input for the case form / import. undefined → leave hints untouched; an array
 * (possibly empty) replaces the whole set. Accepts both the API shape ({question:{en,…}}) and the
 * flat Gemini shape ({en, 'zh-TW', 'zh-CN'}). Blank English questions are dropped.
 */
function validateHintsInput(hints) {
  if (hints === undefined || hints === null) return { ok: true, value: null };
  if (!Array.isArray(hints)) return { ok: false, message: 'hints must be an array.' };
  const cleaned = hints.map((h) => {
    const q = (h && h.question) || h || {};
    return {
      en: String(q.en || '').trim().slice(0, 120),
      zhTw: String(q['zh-TW'] || '').trim().slice(0, 120),
      zhCn: String(q['zh-CN'] || '').trim().slice(0, 120),
      audience: safeJsonArray(h && h.audience).filter(r => QuestCore.ROLES.includes(r)),
      timing: h && Array.isArray(h.timing) && h.timing.length ? h.timing.filter(t => QuestCore.TIMINGS.includes(t)) : null
    };
  }).filter(h => h.en);
  if (cleaned.length > MAX_HINTS_PER_CASE) return { ok: false, message: `At most ${MAX_HINTS_PER_CASE} hints per playbook.` };
  return { ok: true, value: cleaned };
}

/** Replaces every hint of a use case in one transaction. */
async function replaceHints(useCaseId, hints) {
  await db.withTransaction(async (q) => {
    await q('DELETE FROM quest_hints WHERE use_case_id = ?', [useCaseId]);
    for (const h of hints) {
      await q(
        'INSERT INTO quest_hints (use_case_id, question_en, question_zh_tw, question_zh_cn, audience, timing, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [useCaseId, h.en, h.zhTw, h.zhCn, JSON.stringify(h.audience), h.timing && h.timing.length ? JSON.stringify(h.timing) : null]
      );
    }
  });
}

/** announcements row → API shape (all three languages; the client picks one). */
function formatAnnouncementRow(n) {
  return {
    id: n.id,
    title: { en: n.title_en || '', 'zh-TW': n.title_zh_tw || '', 'zh-CN': n.title_zh_cn || '' },
    body: { en: n.body_en || '', 'zh-TW': n.body_zh_tw || '', 'zh-CN': n.body_zh_cn || '' },
    linkUrl: n.link_url || null,
    useCaseId: n.use_case_id || null,
    audience: safeJsonArray(n.audience).filter(r => QuestCore.ROLES.includes(r)),
    startsAt: n.starts_at || null,
    endsAt: n.ends_at || null,
    pinned: n.pinned === 1 || n.pinned === true,
    active: n.active === 1 || n.active === true,
    createdBy: n.created_by || null,
    createdAt: n.created_at,
    updatedAt: n.updated_at
  };
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates an announcement payload. Returns { ok, errors:{field:message}, value } where value holds
 * column-ready values. Limits: title ≤ 60, body ≤ 140 (per language), http(s) links only, existing
 * use case, end date ≥ start date, audience ⊆ ROLES.
 */
async function validateAnnouncement(body) {
  const b = body || {};
  const str = (v, max) => String(v === undefined || v === null ? '' : v).trim().slice(0, max + 1);
  const title = { en: str(b.title?.en, 60), zhTw: str(b.title?.['zh-TW'], 60), zhCn: str(b.title?.['zh-CN'], 60) };
  const text = { en: str(b.body?.en, 140), zhTw: str(b.body?.['zh-TW'], 140), zhCn: str(b.body?.['zh-CN'], 140) };
  const errors = {};
  if (!title.en) errors.titleEn = 'Enter an English title.';
  [['titleEn', title.en], ['titleZhTw', title.zhTw], ['titleZhCn', title.zhCn]].forEach(([k, v]) => {
    if (v.length > 60) errors[k] = 'Keep the title to 60 characters or fewer.';
  });
  [['bodyEn', text.en], ['bodyZhTw', text.zhTw], ['bodyZhCn', text.zhCn]].forEach(([k, v]) => {
    if (v.length > 140) errors[k] = 'Keep the message to 140 characters or fewer.';
  });
  const linkUrl = b.linkUrl ? String(b.linkUrl).trim() : '';
  if (linkUrl && !/^https?:\/\/[^\s]+$/i.test(linkUrl)) errors.linkUrl = 'Enter a link that starts with http:// or https://.';
  const useCaseId = b.useCaseId ? String(b.useCaseId).trim() : '';
  if (useCaseId) {
    const rows = await query('SELECT id FROM use_cases WHERE id = ?', [useCaseId]);
    if (!rows.length) errors.useCaseId = 'Choose a playbook that exists.';
  }
  const startsAt = b.startsAt ? String(b.startsAt) : '';
  const endsAt = b.endsAt ? String(b.endsAt) : '';
  if (startsAt && !ISO_DATE_RE.test(startsAt)) errors.startsAt = 'Enter a valid start date.';
  if (endsAt && !ISO_DATE_RE.test(endsAt)) errors.endsAt = 'Enter a valid end date.';
  if (startsAt && endsAt && !errors.startsAt && !errors.endsAt && endsAt < startsAt) errors.endsAt = 'The end date must be on or after the start date.';
  const audienceIn = Array.isArray(b.audience) ? b.audience : [];
  if (!audienceIn.every(r => QuestCore.ROLES.includes(r))) errors.audience = 'Choose roles from the list.';
  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      title, text,
      linkUrl: linkUrl || null,
      useCaseId: useCaseId || null,
      audience: JSON.stringify([...new Set(audienceIn)]),
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      pinned: b.pinned ? 1 : 0,
      active: b.active === false || b.active === 0 ? 0 : 1
    }
  };
}

/** The stored academic calendar (validated), or the default. */
async function readAcademicCalendar() {
  const setting = await mailer.readSetting(query, CALENDAR_SETTING_KEY);
  return QuestCore.normalizeCalendar(setting && setting.value);
}

/**
 * Everything the Quest Run strip needs in one call. Standard users are matched through their categories:
 * the roles those categories group (teaching -> Lecturer, TA) form the audience set, and hints are limited
 * to playbooks the user can see. Admins previewing the portal may pass ?role= (defaults to Lecturer).
 * Hints are filtered to active ones whose audience includes any of the roles, with timing resolved (hint
 * timing, else the use case timing). News is filtered to active items for those roles that have not clearly
 * expired; the client applies the exact local-date window with QuestCore.newsStatus().
 */
app.get('/api/quest', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ success: false, code: 'session_expired', message: 'Your session has expired. Sign in again.' });
  try {
    const requested = String(req.query.role || '');
    const userCats = user.isAdmin ? null : await userCategories(user.email);
    const roles = user.isAdmin
      ? [QuestCore.ROLES.includes(requested) ? requested : 'Lecturer']
      : CategoryCore.rolesForCategories(userCats);
    const role = roles[0] || 'Lecturer';
    // Empty audience = everyone; otherwise any overlap with the viewer's roles counts
    const audienceMatches = (audience) => !Array.isArray(audience) || audience.length === 0 || roles.some(r => audience.includes(r));
    const calendar = await readAcademicCalendar();
    const now = new Date();
    const position = QuestCore.getAcademicPosition(now, calendar);

    const cases = (await query('SELECT id, timing, categories FROM use_cases'))
      .filter(c => user.isAdmin || CategoryCore.isVisibleTo(c.categories, userCats));
    const timingByCase = Object.fromEntries(cases.map(c => [c.id, parseTiming(c.timing)]));
    const hints = (await query('SELECT * FROM quest_hints WHERE active = 1 ORDER BY id ASC'))
      .map(formatHintRow)
      .filter(h => timingByCase[h.useCaseId] && audienceMatches(h.audience))
      .map(h => ({ id: h.id, useCaseId: h.useCaseId, question: h.question, audience: h.audience, timing: h.timing || timingByCase[h.useCaseId] }));

    // Server-side filter is deliberately loose (one day of slack for time zones); the client is exact.
    const yesterday = QuestCore.localDateIso(new Date(now.getTime() - 86400000));
    const news = (await query('SELECT * FROM announcements WHERE active = 1 ORDER BY pinned DESC, id DESC'))
      .map(formatAnnouncementRow)
      .filter(n => audienceMatches(n.audience) && (!n.endsAt || n.endsAt >= yesterday))
      .map(({ id, title, body, linkUrl, useCaseId, pinned, startsAt, endsAt, active }) => ({ id, title, body, linkUrl, useCaseId, pinned, startsAt, endsAt, active }));

    // Hero follows the viewer's categories (teaching > admin staff > default warrior).
    // Admin previews map the previewed role to its category so the same rule applies.
    const heroCats = user.isAdmin ? [CategoryCore.categoryForRole(role)].filter(Boolean) : userCats;
    res.json({
      success: true, role, heroClass: QuestCore.heroClassForCategories(heroCats),
      calendar, position, today: QuestCore.localDateIso(now), hints, news
    });
  } catch (error) {
    console.error('Quest payload error:', error);
    res.status(500).json({ success: false, message: 'Failed to load Quest Run.' });
  }
});

// Quest Run analytics (deduplicated per page load on the client). News events store use_case_id = 'news:<id>'.
app.post('/api/quest/event', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized session.' });
  const { action, hintId, newsId, useCaseId } = req.body || {};
  if (!QUEST_EVENT_ACTIONS.includes(action)) {
    return res.status(400).json({ success: false, message: `action must be one of: ${QUEST_EVENT_ACTIONS.join(', ')}.` });
  }
  const isNews = action.startsWith('news_');
  const target = isNews ? (newsId ? `news:${parseInt(newsId, 10) || 0}` : null) : (useCaseId ? String(useCaseId).slice(0, 100) : null);
  if (!target) return res.status(400).json({ success: false, message: isNews ? 'newsId is required.' : 'useCaseId is required.' });
  try {
    await query('INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)', [action, target, req.session.user.email]);
    res.json({ success: true, hintId: hintId || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Admin: hints (all admins may read; super admins write, matching playbook edit rights) ---
const blockAssistWrites = (req, res, next) => (req.session.user.isAssist
  ? res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to edit playbook hints.' })
  : next());

// ==========================================
// 5b-3. Feedback -> playbook conversion
// ==========================================

/** Links a feedback to the playbook it became / enhanced. Silently ignores unknown ids. */
async function markFeedbackConverted(feedbackId, useCaseId) {
  await query('UPDATE feedbacks SET converted_use_case_id = ?, converted_at = CURRENT_TIMESTAMP WHERE id = ?',
    [useCaseId ? String(useCaseId).slice(0, 100) : null, feedbackId]);
}

/** Rejects after `ms` so a slow / unavailable Vertex call never blocks the admin UI. */
const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
]);

/** Score at/above which "enhance the existing playbook" is recommended over "create a new one". */
const ENHANCE_THRESHOLD = 60;

/** One searchable text per playbook: title twice (titles matter most), summary, and the zh title/summary. */
const caseSearchText = (uc) => {
  const t = safeJsonObject(uc.translations);
  const zh = ['zh-TW', 'zh-CN'].map(l => `${(t[l] && t[l].title) || ''} ${(t[l] && t[l].summary) || ''}`).join(' ');
  return `${uc.title} ${uc.title} ${uc.summary || ''} ${zh}`;
};

function safeJsonObject(raw) {
  try { const v = typeof raw === 'string' ? JSON.parse(raw) : raw; return v && typeof v === 'object' ? v : {}; } catch (_) { return {}; }
}

/**
 * Stage 2 of the similarity check: Gemini reranks the shortlist from stage 1 (lib/similarity.js
 * shortlistForRerank). Gemini only ever sees id + title + a 280-char summary per playbook, never steps or
 * prompts, so a call costs ~60 input tokens per shortlisted playbook. Keyword matching alone misses
 * cross-language or paraphrased ideas, which is why Gemini does the final judgement.
 *
 * With `assessClarity` (feedback conversion) the same call also judges whether the idea is specific enough
 * to draft a playbook, and writes clarification questions when it isn't. One call, no extra latency.
 * Returns { matches:[{id, score, reason}], recommendation, suggestedTitle, clarity|null } or throws.
 */
async function geminiSimilarity(ideaText, cases, { assessClarity = false, kind = 'feedback' } = {}) {
  const catalogue = cases.map(c => ({ id: c.id, title: c.title, summary: String(c.summary || '').slice(0, 280) }));
  const label = kind === 'draft' ? 'A new playbook the admin is about to create' : 'User feedback';
  const clarityRule = assessClarity ? `
Also judge whether the feedback is specific enough to draft a playbook WITHOUT guessing. It must make clear
(a) who would use it (audience), (b) the task or problem, and (c) roughly what Gemini should produce (output).
If it is not, set actionable=false, list the missing facts, and write 1-3 short, friendly questions to ask the
author, in the SAME language as the feedback. If it is clear enough, set actionable=true and questions=[].` : '';
  const claritySchema = assessClarity
    ? `,\n "clarity":{"actionable":true|false,"missing":["audience"|"task"|"output"],"questions":["<question>"]}` : '';
  const promptText = `
You help the admin of a university "Gemini Enterprise" playbook portal avoid duplicate playbooks.
A playbook is a step-by-step guide + sample prompt for one teaching or campus-operations task.

${label}:
"""${String(ideaText).slice(0, 2000)}"""

Existing playbooks (JSON):
${JSON.stringify(catalogue)}

Decide whether the idea is something an EXISTING playbook already covers (so it should be enhanced)
or a genuinely NEW idea. Score how closely each relevant playbook matches the idea (0-100; 80+ = same task,
50-79 = closely related, below 50 = loosely related). Only include playbooks scoring 30 or more, best first, max 5.${clarityRule}

Return ONLY JSON, no markdown:
{"matches":[{"id":"<playbook id>","score":<0-100>,"reason":"<one short sentence in English>"}],
 "recommendation":"enhance" | "new",
 "suggestedTitle":"<short English title for a new playbook based on the idea>"${claritySchema}}`;
  const out = await withTimeout(callGeminiJson(promptText), 25000);
  const known = new Set(cases.map(c => c.id));
  const matches = (Array.isArray(out && out.matches) ? out.matches : [])
    .filter(m => m && known.has(m.id))
    .map(m => ({ id: m.id, score: Math.max(0, Math.min(100, Math.round(Number(m.score) || 0))), reason: String(m.reason || '').slice(0, 300) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  return {
    matches,
    recommendation: out && out.recommendation === 'enhance' && matches.length ? 'enhance' : 'new',
    suggestedTitle: String((out && out.suggestedTitle) || '').slice(0, 120),
    clarity: assessClarity ? normalizeClarity(out && out.clarity) : null
  };
}

/** Gemini's clarity block -> { actionable, missing:[known keys], questions:[<=3 strings] }; garbage -> null. */
const normalizeClarity = (c) => {
  if (!c || typeof c !== 'object' || typeof c.actionable !== 'boolean') return null;
  const missing = (Array.isArray(c.missing) ? c.missing : []).filter(k => ['audience', 'task', 'output'].includes(k));
  const questions = (Array.isArray(c.questions) ? c.questions : [])
    .map(q => String(q || '').trim().slice(0, 240)).filter(Boolean).slice(0, 3);
  return { actionable: c.actionable, missing: c.actionable ? [] : missing, questions: c.actionable ? [] : questions };
};

/*
 * Short-lived cache of Gemini similarity results. Re-opening the convert dialog, or saving a new playbook
 * right after drafting it, would otherwise repeat an identical Vertex call. The key includes a catalogue
 * version (playbook count + newest updated_at), so any playbook create / edit / delete invalidates it.
 */
const SIMILARITY_CACHE_TTL_MS = 15 * 60 * 1000;
const SIMILARITY_CACHE_MAX = 200;
const similarityCache = new Map();
const cacheGet = (key) => {
  const hit = similarityCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > SIMILARITY_CACHE_TTL_MS) { similarityCache.delete(key); return null; }
  return hit.value;
};
const cacheSet = (key, value) => {
  if (similarityCache.size >= SIMILARITY_CACHE_MAX) similarityCache.delete(similarityCache.keys().next().value);
  similarityCache.set(key, { at: Date.now(), value });
};

/*
 * Shared similarity check, used by "Convert to playbook" and by the admin's "New playbook" form.
 *   1. Load only the compact columns (id, title, summary, translations), never steps / prompts.
 *   2. Stage 1: keyword shortlist (whole catalogue while it has <= 40 playbooks).
 *   3. Stage 2: Gemini rerank of the shortlist (cached 15 min); keyword cosine ranking if Vertex fails.
 *   4. "enhance" is recommended when the best match scores >= ENHANCE_THRESHOLD.
 *   5. With assessClarity, the result also says whether the idea is specific enough to draft from.
 *      The heuristic gate (lib/idea-quality.js) always applies, so text that fails it is never "actionable"
 *      even if Gemini is generous; when Gemini is unavailable the heuristic's missing facts are used.
 */
async function findSimilarPlaybooks({ text, excludeId = null, assessClarity = false, kind = 'feedback' }) {
  const all = await query('SELECT id, title, summary, translations, categories, creator, updated_at FROM use_cases ORDER BY id ASC');
  const cases = excludeId ? all.filter(c => c.id !== excludeId) : all;
  const byId = Object.fromEntries(cases.map(c => [c.id, c]));
  const version = `${cases.length}:${cases.reduce((m, c) => (String(c.updated_at || '') > m ? String(c.updated_at || '') : m), '')}`;
  const { docs: shortlist, prefiltered } = shortlistForRerank(text, cases.map(c => ({ ...c, text: caseSearchText(c) })));

  let result;
  let source = 'gemini';
  const cacheKey = sha256(JSON.stringify([kind, assessClarity, excludeId, String(text), version]));
  try {
    result = cacheGet(cacheKey);
    if (!result) {
      result = await geminiSimilarity(text, shortlist, { assessClarity, kind });
      cacheSet(cacheKey, result);
    }
  } catch (err) {
    console.warn('Similarity: Gemini unavailable, using keyword ranking.', err.message);
    source = 'keyword';
    const ranked = rankBySimilarity(text, cases.map(c => ({ id: c.id, text: caseSearchText(c) })), 5);
    result = { matches: ranked.map(r => ({ id: r.id, score: r.score, reason: '' })), recommendation: null, suggestedTitle: '', clarity: null };
  }

  const matches = result.matches.filter(m => byId[m.id]).map(m => ({
    ...m,
    title: byId[m.id].title,
    summary: byId[m.id].summary,
    categories: CategoryCore.normalizeCategories(byId[m.id].categories),
    creator: byId[m.id].creator || null
  }));
  const top = matches[0];
  const recommendation = top && top.score >= ENHANCE_THRESHOLD && result.recommendation !== 'new' ? 'enhance' : 'new';

  let clarity = null;
  if (assessClarity) {
    const heuristic = IdeaQuality.assessIdea(text);
    const gate = IdeaQuality.assessFeedback(text);
    const fromGemini = result.clarity;
    clarity = fromGemini
      ? { ...fromGemini, actionable: fromGemini.actionable && gate.ok, missing: fromGemini.actionable && !gate.ok ? heuristic.missing : fromGemini.missing, source: 'gemini' }
      : { actionable: heuristic.actionable, missing: heuristic.actionable ? [] : heuristic.missing, questions: [], source: 'heuristic' };
  }

  return {
    source, prefiltered, considered: source === 'gemini' ? shortlist.length : cases.length, total: cases.length,
    matches, recommendation, recommendedId: recommendation === 'enhance' ? top.id : null,
    suggestedTitle: result.suggestedTitle, threshold: ENHANCE_THRESHOLD, clarity
  };
}

/** Assistant admins can read but never create playbooks: shared guard for the similarity endpoints. */
const blockAssistCreate = (req, res, next) => (req.session.user.isAssist
  ? res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to create playbooks.' })
  : next());

/*
 * Step 1 of "Convert to Playbook": similar playbooks + a clarity verdict for the feedback idea.
 * When clarity.actionable is false the client asks the admin to answer (or email the author) the
 * clarification questions before a new playbook is drafted.
 */
app.post('/api/admin/feedbacks/:id/similar', requireAdmin, blockAssistCreate, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM feedbacks WHERE id = ?', [parseInt(req.params.id, 10) || 0]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Feedback not found.' });
    const feedback = rows[0];
    const result = await findSimilarPlaybooks({ text: feedback.feedback_text, assessClarity: true, kind: 'feedback' });
    const creatorEmail = feedback.user_email && feedback.user_email !== 'anonymous' ? feedback.user_email : null;
    res.json({
      success: true,
      ...result,
      feedback: { id: feedback.id, text: feedback.feedback_text, userEmail: creatorEmail, convertedUseCaseId: feedback.converted_use_case_id || null }
    });
  } catch (error) {
    console.error('Feedback similarity error:', error);
    res.status(500).json({ success: false, message: 'Failed to look for similar playbooks.' });
  }
});

/*
 * Same check for a playbook the admin creates by hand: called before "Draft with Gemini" and before the
 * first save of a new playbook. Body: { title, summary, instruction, excludeId? }.
 */
app.post('/api/admin/use-cases/similar', requireAdmin, blockAssistCreate, async (req, res) => {
  const b = req.body || {};
  const pick = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
  const text = [pick(b.title, 200), pick(b.summary, 800), pick(b.instruction, 1500)].filter(Boolean).join('\n');
  if (!text) return res.status(400).json({ success: false, message: 'Enter a title, summary or Gemini instruction first.' });
  try {
    const result = await findSimilarPlaybooks({ text, excludeId: pick(b.excludeId, 100) || null, kind: 'draft' });
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Playbook similarity error:', error);
    res.status(500).json({ success: false, message: 'Failed to look for similar playbooks.' });
  }
});

// Link (or unlink with useCaseId: null) a feedback to a playbook manually.
app.post('/api/admin/feedbacks/:id/convert', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to create playbooks.' });
  }
  const id = parseInt(req.params.id, 10) || 0;
  const useCaseId = req.body && req.body.useCaseId ? String(req.body.useCaseId) : null;
  try {
    if (useCaseId && !(await query('SELECT id FROM use_cases WHERE id = ?', [useCaseId])).length) {
      return res.status(404).json({ success: false, message: 'Playbook not found.' });
    }
    await markFeedbackConverted(id, useCaseId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update the feedback.' });
  }
});

// ==========================================
// 5b-4. Creator dashboards
// ==========================================

/** Pure: '1m' | '3m' | '6m' -> 'YYYY-MM-DD HH:MM:SS' (UTC, same format CURRENT_TIMESTAMP stores); 'all' -> null. */
const sinceForRange = (range, now = new Date()) => {
  const months = { '1m': 1, '3m': 3, '6m': 6 }[range];
  if (!months) return null;
  const d = new Date(now.getTime());
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

/** Rows [{creator, cnt}] -> [{creator, count}] with numeric counts (pg returns COUNT as a string). */
const toLeaderboard = (rows) => rows
  .map(r => ({ creator: r.creator, count: Math.max(0, parseInt(r.cnt, 10) || 0) }))
  .filter(r => r.count > 0)
  .sort((a, b) => b.count - a.count || String(a.creator).localeCompare(String(b.creator)))
  .slice(0, 10);

/*
 * GET /api/admin/stats/creators?range=all|1m|3m|6m
 *   providers : playbooks credited to each creator, created in the window (default playbooks excluded)
 *   views     : 'view' events in the window on each creator's playbooks
 *   likes     : overall = current likes (user_preferences); windowed = like - unlike events in the window
 *               (user_preferences has no timestamp), floored at 0
 *   topCases  : most viewed / liked playbooks in the window, default playbooks included for context
 */
app.get('/api/admin/stats/creators', requireAdmin, async (req, res) => {
  const range = ['all', '1m', '3m', '6m'].includes(req.query.range) ? req.query.range : 'all';
  const since = sinceForRange(range);
  const hasCreator = "uc.creator IS NOT NULL AND uc.creator <> ''";
  const tsFilter = (col) => (since ? ` AND ${col} >= ?` : '');
  const p = since ? [since] : [];
  try {
    const providers = await query(
      `SELECT uc.creator, COUNT(*) as cnt FROM use_cases uc WHERE ${hasCreator}${tsFilter('uc.created_at')} GROUP BY uc.creator`, p);
    const views = await query(
      `SELECT uc.creator, COUNT(*) as cnt FROM analytics a JOIN use_cases uc ON uc.id = a.use_case_id
       WHERE a.action = 'view' AND ${hasCreator}${tsFilter('a.timestamp')} GROUP BY uc.creator`, p);
    const likes = since
      ? await query(
        `SELECT uc.creator, SUM(CASE WHEN a.action = 'like' THEN 1 WHEN a.action = 'unlike' THEN -1 ELSE 0 END) as cnt
         FROM analytics a JOIN use_cases uc ON uc.id = a.use_case_id
         WHERE a.action IN ('like','unlike') AND ${hasCreator} AND a.timestamp >= ? GROUP BY uc.creator`, p)
      : await query(
        `SELECT uc.creator, COUNT(*) as cnt FROM user_preferences up JOIN use_cases uc ON uc.id = up.use_case_id
         WHERE up.is_liked = true AND ${hasCreator} GROUP BY uc.creator`);

    // Per-playbook views + likes in the same window
    const caseViews = await query(
      `SELECT use_case_id, COUNT(*) as cnt FROM analytics a WHERE action = 'view'${tsFilter('a.timestamp')} GROUP BY use_case_id`, p);
    const caseLikes = since
      ? await query(
        `SELECT use_case_id, SUM(CASE WHEN action = 'like' THEN 1 WHEN action = 'unlike' THEN -1 ELSE 0 END) as cnt
         FROM analytics a WHERE action IN ('like','unlike') AND a.timestamp >= ? GROUP BY use_case_id`, p)
      : await query('SELECT use_case_id, COUNT(*) as cnt FROM user_preferences WHERE is_liked = true GROUP BY use_case_id');
    const toMap = (rows) => Object.fromEntries(rows.map(r => [r.use_case_id, Math.max(0, parseInt(r.cnt, 10) || 0)]));
    const vMap = toMap(caseViews);
    const lMap = toMap(caseLikes);
    const allCases = await query('SELECT id, title, creator FROM use_cases');
    const topCases = allCases
      .map(c => ({ id: c.id, title: c.title, creator: c.creator || null, views: vMap[c.id] || 0, likes: lMap[c.id] || 0 }))
      .filter(c => c.views || c.likes)
      .sort((a, b) => (b.views + b.likes * 3) - (a.views + a.likes * 3) || a.title.localeCompare(b.title))
      .slice(0, 10);

    const community = allCases.filter(c => c.creator);
    const converted = await query('SELECT COUNT(*) as cnt FROM feedbacks WHERE converted_use_case_id IS NOT NULL');
    res.json({
      success: true, range, since,
      summary: {
        communityPlaybooks: community.length,
        defaultPlaybooks: allCases.length - community.length,
        creators: new Set(community.map(c => c.creator)).size,
        convertedFeedbacks: parseInt(converted[0].cnt, 10) || 0
      },
      providers: toLeaderboard(providers),
      views: toLeaderboard(views),
      likes: toLeaderboard(likes),
      topCases
    });
  } catch (error) {
    console.error('Creator stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load creator statistics.' });
  }
});

app.get('/api/admin/hints', requireAdmin, async (req, res) => {
  try {
    const rows = req.query.useCaseId
      ? await query('SELECT * FROM quest_hints WHERE use_case_id = ? ORDER BY id ASC', [String(req.query.useCaseId)])
      : await query('SELECT * FROM quest_hints ORDER BY id ASC');
    res.json({ success: true, hints: rows.map(formatHintRow) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/** Validates a single admin hint payload for POST/PUT /api/admin/hints. */
async function validateSingleHint(body, requireUseCase) {
  const check = validateHintsInput([body || {}]);
  if (!check.ok || !check.value.length) return { ok: false, message: 'Enter the English question.' };
  const useCaseId = body && body.useCaseId ? String(body.useCaseId) : '';
  if (requireUseCase) {
    const rows = useCaseId ? await query('SELECT id FROM use_cases WHERE id = ?', [useCaseId]) : [];
    if (!rows.length) return { ok: false, message: 'Choose a playbook that exists.' };
  }
  return { ok: true, value: check.value[0], useCaseId, active: body.active === false || body.active === 0 ? 0 : 1 };
}

app.post('/api/admin/hints', requireAdmin, blockAssistWrites, async (req, res) => {
  const v = await validateSingleHint(req.body, true);
  if (!v.ok) return res.status(400).json({ success: false, message: v.message });
  try {
    const id = await insertReturningId(
      'INSERT INTO quest_hints (use_case_id, question_en, question_zh_tw, question_zh_cn, audience, timing, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [v.useCaseId, v.value.en, v.value.zhTw, v.value.zhCn, JSON.stringify(v.value.audience), v.value.timing ? JSON.stringify(v.value.timing) : null, v.active]
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/hints/:id', requireAdmin, blockAssistWrites, async (req, res) => {
  const v = await validateSingleHint(req.body, false);
  if (!v.ok) return res.status(400).json({ success: false, message: v.message });
  try {
    const result = await query(
      `UPDATE quest_hints SET question_en = ?, question_zh_tw = ?, question_zh_cn = ?, audience = ?, timing = ?, active = ? WHERE id = ?${dbType === 'postgres' ? ' RETURNING id' : ''}`,
      [v.value.en, v.value.zhTw, v.value.zhCn, JSON.stringify(v.value.audience), v.value.timing ? JSON.stringify(v.value.timing) : null, v.active, parseInt(req.params.id, 10) || 0]
    );
    if (!db.affectedRows(result)) return res.status(404).json({ success: false, message: 'Hint not found.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/hints/:id', requireAdmin, blockAssistWrites, async (req, res) => {
  try {
    await query('DELETE FROM quest_hints WHERE id = ?', [parseInt(req.params.id, 10) || 0]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Admin: announcements (News tab — every admin, including assistants) ---
app.get('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM announcements ORDER BY pinned DESC, id DESC');
    // Reach: distinct users who saw the scroll, and total clicks, keyed by 'news:<id>'
    const seen = await query("SELECT use_case_id, COUNT(DISTINCT user_email) as cnt FROM analytics WHERE action = 'news_view' GROUP BY use_case_id");
    const clicks = await query("SELECT use_case_id, COUNT(*) as cnt FROM analytics WHERE action = 'news_click' GROUP BY use_case_id");
    const toMap = (list) => Object.fromEntries(list.map(r => [r.use_case_id, parseInt(r.cnt, 10) || 0]));
    const seenMap = toMap(seen);
    const clickMap = toMap(clicks);
    res.json({
      success: true,
      announcements: rows.map(formatAnnouncementRow).map(n => ({ ...n, seenCount: seenMap[`news:${n.id}`] || 0, clickCount: clickMap[`news:${n.id}`] || 0 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    const v = await validateAnnouncement(req.body);
    if (!v.ok) return res.status(400).json({ success: false, message: 'Check the highlighted fields.', errors: v.errors });
    const x = v.value;
    const id = await insertReturningId(
      `INSERT INTO announcements (title_en, title_zh_tw, title_zh_cn, body_en, body_zh_tw, body_zh_cn, link_url, use_case_id, audience, starts_at, ends_at, pinned, active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [x.title.en, x.title.zhTw, x.title.zhCn, x.text.en, x.text.zhTw, x.text.zhCn, x.linkUrl, x.useCaseId, x.audience, x.startsAt, x.endsAt, x.pinned, x.active, req.session.user.email]
    );
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  try {
    const v = await validateAnnouncement(req.body);
    if (!v.ok) return res.status(400).json({ success: false, message: 'Check the highlighted fields.', errors: v.errors });
    const x = v.value;
    const result = await query(
      `UPDATE announcements SET title_en = ?, title_zh_tw = ?, title_zh_cn = ?, body_en = ?, body_zh_tw = ?, body_zh_cn = ?, link_url = ?, use_case_id = ?,
       audience = ?, starts_at = ?, ends_at = ?, pinned = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?${dbType === 'postgres' ? ' RETURNING id' : ''}`,
      [x.title.en, x.title.zhTw, x.title.zhCn, x.text.en, x.text.zhTw, x.text.zhCn, x.linkUrl, x.useCaseId, x.audience, x.startsAt, x.endsAt, x.pinned, x.active, parseInt(req.params.id, 10) || 0]
    );
    if (!db.affectedRows(result)) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM announcements WHERE id = ?', [parseInt(req.params.id, 10) || 0]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Super admin: academic calendar (Admin → Settings → Calendar) ---
app.get('/api/admin/settings/calendar', requireSuper, async (req, res) => {
  try {
    const setting = await mailer.readSetting(query, CALENDAR_SETTING_KEY);
    res.json({
      success: true,
      calendar: await readAcademicCalendar(),
      defaults: QuestCore.DEFAULT_ACADEMIC_CALENDAR,
      isDefault: !setting,
      updatedBy: setting ? setting.updatedBy : null,
      updatedAt: setting ? setting.updatedAt : null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/settings/calendar', requireSuper, async (req, res) => {
  const cal = req.body && req.body.calendar;
  const check = QuestCore.validateCalendar(cal);
  if (!check.ok) {
    return res.status(400).json({ success: false, message: 'Terms must use valid dates and follow each other with no gaps or overlaps.', errors: check.errors });
  }
  try {
    const value = QuestCore.normalizeCalendar(cal);
    await mailer.writeSetting(query, CALENDAR_SETTING_KEY, value, req.session.user.email);
    res.json({ success: true, calendar: value, position: QuestCore.getAcademicPosition(new Date(), value) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset to default: drop the stored override so the built-in calendar applies again.
app.delete('/api/admin/settings/calendar', requireSuper, async (req, res) => {
  try {
    await query('DELETE FROM app_settings WHERE key = ?', [CALENDAR_SETTING_KEY]);
    const calendar = QuestCore.normalizeCalendar(null);
    res.json({ success: true, calendar, position: QuestCore.getAcademicPosition(new Date(), calendar) });
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
    const message = error.code === 'NO_ENCRYPTION_KEY' ? error.message : 'Failed to save email settings.';
    res.status(500).json({ success: false, message });
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

/*
 * Playbook drafting prompt. Every way of making a playbook (New playbook, Convert feedback → Create new,
 * Convert feedback → Improve selected, similar-check → Improve selected, Refine with Gemini) goes through
 * buildDraftPrompt(), so they all follow the same design logic and feature guide.
 *
 *   editable part  = DEFAULT_DRAFT_GUIDE, or the admin's override in app_settings['draft_prompt']
 *                    (Admin → Settings → Playbook drafting prompt, super admins). Read on every draft.
 *   fixed parts    = current form values, the task (create / improve + the idea + clarifications),
 *                    language consistency and the JSON output contract, which the admin form parses.
 */
const DRAFT_PROMPT_SETTING_KEY = 'draft_prompt';
const DRAFT_PROMPT_MAX = 30000;

const DEFAULT_DRAFT_GUIDE = `You are the Playbook Architect for "Gemini Enterprise - Edu Portal", a library of ready-to-use Gemini Enterprise playbooks for schools and universities. A playbook solves one real job for one audience, using the Gemini Enterprise feature(s) that fit that job best.

HOW TO DESIGN A PLAYBOOK (apply the same steps to new playbooks, user ideas and improvements)
A. Understand the job: who does it (audience), what they do today, the input they already have (files, emails, data) and the output they need.
B. Choose the features with the FEATURE GUIDE below. The form's current features are a starting point, not a rule: pick the smallest set that does the job well, and change it when the idea needs a different feature. Never add a feature just to list it.
C. Design the flow: 3 steps (set up, run, review) and a ready-to-paste prompt for the main feature.
D. Make it safe and grounded: name the sources, require evidence, and keep a person in the loop before anything reaches students or the public.
E. Explain the feature choice in "designNotes".

FEATURE GUIDE (pick by the job, not by habit)
- Gemini (general chat): a quick one-off answer, rewrite or brainstorm with no files. promptType general.
- Canvas Mode: a long document the user will edit and share (guide, letter, proposal, lesson plan, report). promptType canvas.
- Gemini Notebook: answers, checks or analysis grounded in the user's OWN files (rubrics, policies, transcripts, receipts, papers), with citations. promptType notebooklm.
- Deep Research: a cited report from many public web sources (market trends, literature, regulations, funder priorities). promptType deep_research. Deep Research cannot read a Gemini Notebook; run it in Gemini and add the report to a notebook as a source if needed.
- Skills: a reusable, named procedure the user saves once and Gemini applies every time the same kind of task comes up (feedback in "my marking voice", minutes in the office's format, a revision quiz from any notes). Use it when the same task repeats with different inputs and must always follow the same steps and format. promptType skills. The prompt is the skill definition with these labelled sections: SKILL NAME, DESCRIPTION (when Gemini should use it, starting "Use this skill when ..."), INPUTS, INSTRUCTIONS (numbered), OUTPUT FORMAT, QUALITY CHECKS and one short EXAMPLE.
  SKILLS ARE GENERIC: the skill definition never names a course, school, office, person or other specific context and contains NO {{VARIABLES}}. INPUTS lists what the user gives in the request when calling the skill (course, level, rubric, template, examples), with sensible defaults when they don't. Skills cannot hold attachments: never tell the user to attach or upload files to a skill; rubrics, templates and example texts are pasted or attached in the chat request each time. Put the specifics in a Set up prompt titled "Prompt to Use the Skill ..." (type general, or canvas when the result is a document) that calls the skill by name and carries the {{VARIABLES}}.
- Agent Designer, CHAT AGENT: an assistant that many people talk to over time (tutor, policy help desk, IT service desk, drill simulator). It answers from Knowledge files with citations. Title ends "Chat Agent"; step 1 or 2 says "create a chat agent in Agent Designer". promptType agent_designer.
- Agent Designer, WORKFLOW AGENT: a repeatable multi-step process that starts on its own or from a form, branches on conditions and needs human approval (intake triage, approvals, moderation, screening). Title ends "Workflow Agent"; steps say "create a workflow agent in Agent Designer and paste the prompt into the assistant to build the flow". The Agent Designer assistant cannot take attachments, so knowledge files are added by hand to the agent nodes AFTER the flow is created; the steps must say this. Prefer a real trigger: a new file in a Google Drive folder (Drive Connector) or a new email in a shared mailbox (Email Connector). After approval, the workflow can send the approved email or save the file through the connector. promptType agent_designer.
- Image Generation / Video Generation: visuals (posters, diagrams, short clips). promptType image / video.
Typical combinations: Gemini Notebook to prepare and verify sources → Agent Designer chat agent with the same files; Deep Research → Gemini Notebook → Canvas Mode for a cited document; Skills for the repeated step inside a larger routine.

PLAYBOOK CONVENTIONS (match the portal's existing playbooks exactly)
1. VARIABLES: write every fill-in value as {{UPPER_SNAKE_CASE}}, e.g. {{COURSE_NAME}}, {{INSTITUTION_NAME}}, {{TARGET_AUDIENCE}}. Use 2-6 variables (Skills: none in the skill definition; put them in the "Prompt to Use the Skill ..." Set up prompt). Never use square brackets such as [COURSE_NAME]. Use the SAME English variable keys in en, zh-TW and zh-CN; never translate a key. Variables belong ONLY in the prompt and Set up prompts (the portal substitutes them there); NEVER put a {{VARIABLE}} in "steps", because steps are shown as-is. In steps write plain words instead, e.g. "your department", "your course" (zh-TW 你的科系 / 你的課程, zh-CN 你的院系 / 你的课程).
2. STEPS: exactly 3 steps of one or two sentences each, with no {{VARIABLES}}, in this order:
   (1) Set up and ground: what to prepare, which files to add and which feature to open.
   (2) Run: use the sample prompt in the named feature.
   (3) Review and deliver: what a person checks before the result is shared.
3. PROMPT: a ready-to-paste prompt for the main feature. Open with the role ("You are ..." or "Act as ...") or, for Skills, with "SKILL NAME:"; use numbered or labelled sections, and describe the expected output. If the prompt should produce a document, end it with: "Use Canvas to create this as an editable document." Exception: never add the Canvas sentence or "in Canvas Mode" to Agent Designer instructions or Skills (promptType agent_designer / skills); they reply with structured text (headings, tables) and Canvas Mode is only used by Set up prompts run in Gemini.
4. PROMPT TYPE ("promptType"), one of: general | notebooklm | deep_research | agent_designer | skills | canvas | image | video. Match the feature the prompt is pasted into: Agent Designer -> agent_designer, Skills -> skills, Gemini Notebook -> notebooklm, Deep Research -> deep_research, Canvas Mode -> canvas, Image Generation -> image, Video Generation -> video, anything else -> general.
5. AGENT DESIGNER WORKFLOWS (workflow agents): label each step "STEP n · NAME (node type)"; start with "STEP 1 · TRIGGER (...)" naming the trigger (Drive Connector: new file in folder, Email Connector: new email in a shared mailbox, or a start form); write branches as "IF ... → go to Step n" in a condition node; keep the flow forward-only (never loop back to an earlier step); give approval nodes exactly two outcomes, Approve or Reject, and name the approver; label the reference files "KNOWLEDGE SOURCES (added manually to the agent nodes after the flow is created)": never say to attach files while building the workflow, because the assistant that builds it can't take attachments, and never ask for file uploads during a run; send or save results through the connector only after approval; end with a log row (date, reference, route, approver, outcome).
6. AGENT DESIGNER CHAT AGENTS: the prompt is the agent's instructions: who it serves, KNOWLEDGE SOURCES, GROUNDING RULES, how to answer (format, tone, length), what to refuse, and when to hand over to a named person or office.
7. CONNECTORS: list one only when the playbook really reads or writes live data through that system (a workflow trigger counts), otherwise return []. Use these names exactly: "Drive Connector", "Email Connector", "LMS Connector", "Calendar Connector".
8. WRITING: plain, friendly English with short sentences. zh-TW is Traditional Chinese as written in Hong Kong; zh-CN is Simplified Chinese. Keep product names in English inside Chinese text: Gemini, Gemini Enterprise, Gemini Notebook, Canvas Mode, Deep Research, Agent Designer, Skills, Image Generation, Video Generation and the connector names.
9. BRAND: never say "Gem" (always "Agent") and never say "Copilot".
10. SET UP PROMPTS ("helperPrompts"): 1-3 short ready-to-paste prompts that prepare what step 1 needs (sample data, a rules table, a template, a source summary; for Skills, first the "Prompt to Use the Skill ..." calling prompt). Each has a title starting "Prompt to ..." (zh-TW / zh-CN titles end with 提示詞 / 提示词), a type from the PROMPT TYPE list, and reuses the main prompt's {{VARIABLE}} keys where they fit. If a set up prompt creates a document, set type "canvas" and end it with the Canvas sentence in that language: en "Use Canvas to create this as an editable document.", zh-TW "請使用 Canvas 將此內容建立為可編輯文件。", zh-CN "请使用 Canvas 将此内容创建为可编辑文档。" Keep the same number and order of entries in en, zh-TW and zh-CN.
11. GROUNDING: Agent Designer cannot read a Gemini Notebook and there is no notebook connector. When a playbook prepares sources in Gemini Notebook and then builds an Agent, step 1 or 2 must tell the user to add the same files under "Agent Designer › Knowledge › Add files" (same file names, so citations match), and use the notebook to check the Agent's answers. A prompt that relies on files must include a "KNOWLEDGE SOURCES" section (what the files are) and "GROUNDING RULES": use only those sources, cite the file and page / slide / section, say clearly when something isn't covered (and who to ask), never invent facts, figures or quotes. Never write "manually upload ... into the system instructions" or "connect Gemini Notebook to the Agent".
12. CONSISTENCY: every listed GE feature and connector must be used in a step or in the prompt; remove any that are not. A connector-based prompt names the connector as its data source and never searches the web for personal data. Prompts that analyse sources or data must require evidence (citations or data points) and say what to do when evidence is missing.`;

/** The admin's saved drafting guide, or the default. Never throws (a DB error falls back to the default). */
async function readDraftGuide() {
  try {
    const setting = await mailer.readSetting(query, DRAFT_PROMPT_SETTING_KEY);
    const text = setting && setting.value && typeof setting.value.text === 'string' ? setting.value.text.trim() : '';
    return text ? { text, isDefault: false, updatedBy: setting.updatedBy, updatedAt: setting.updatedAt }
      : { text: DEFAULT_DRAFT_GUIDE, isDefault: true, updatedBy: null, updatedAt: null };
  } catch (err) {
    console.warn('⚠️ Draft prompt setting unreadable, using the default:', err.message);
    return { text: DEFAULT_DRAFT_GUIDE, isDefault: true, updatedBy: null, updatedAt: null };
  }
}

/** Where a draft request comes from. Only changes the wording of the task, never the design rules. */
const DRAFT_ORIGINS = Object.freeze({
  manual: 'an admin\'s own idea',
  feedback: 'a user\'s feedback idea submitted in the portal',
  similar: 'an admin\'s idea that overlaps this existing playbook'
});

/**
 * Build the drafting brief. Pure.
 * @param {object}  form           current case-form values (title, categories, features, connectors, promptType)
 * @param {string}  original       JSON of the stored playbook when improving, '' when creating
 * @param {string}  instruction    admin's free-text request (may be empty)
 * @param {string}  [origin]       manual | feedback | similar (see DRAFT_ORIGINS)
 * @param {string}  [idea]         the idea text (feedback text / similar-check quote), may be empty
 * @param {Array}   [clarifications] [{q, a}] answers to clarification questions
 * @param {string}  [guide]        editable guide text (defaults to DEFAULT_DRAFT_GUIDE)
 */
const buildDraftPrompt = ({ form, original, instruction, origin, idea, clarifications, guide }) => {
  const source = DRAFT_ORIGINS[origin] || DRAFT_ORIGINS.manual;
  const qa = (Array.isArray(clarifications) ? clarifications : [])
    .filter(x => x && String(x.a || '').trim())
    .map(x => `- Q: ${String(x.q || '').slice(0, 300)}\n  A: ${String(x.a).slice(0, 1000)}`);
  const ideaBlock = [
    `Source: ${source}.`,
    idea ? `Idea: ${JSON.stringify(String(idea).slice(0, 4000))}` : '',
    qa.length ? `Clarifications from the author / admin:\n${qa.join('\n')}` : '',
    instruction ? `Admin instructions (highest priority): ${JSON.stringify(instruction)}` : ''
  ].filter(Boolean).join('\n');

  const head = `CURRENT FORM VALUES
- Title: ${JSON.stringify(form.title || '')}
- Audience categories: ${JSON.stringify(CategoryCore.normalizeCategories(form.categories))}
- GE features: ${JSON.stringify(form.features || [])}
- Connectors: ${JSON.stringify(form.connectors || [])}
- Prompt type: ${JSON.stringify(form.promptType || 'general')}`;

  const task = original
    ? `TASK: IMPROVE AN EXISTING PLAYBOOK
${ideaBlock}
Stored playbook (all languages):
${original}

Follow HOW TO DESIGN A PLAYBOOK for the parts the idea or instructions touch. ${idea ? 'Work the idea into the playbook: keep what already works and add what is missing.' : 'With instructions only, apply just the changes they ask for.'} Re-check the feature choice against the FEATURE GUIDE and change features, connectors and promptType only when the idea or instructions need it or the current choice clearly breaks the guide; say so in "designNotes". Echo every untouched title, summary, step, prompt, tip and Set up prompt back unchanged (draft 1-3 Set up prompts if there are none). Always allowed: convert [VARIABLE] placeholders to {{VARIABLE}}, keep variable keys identical across languages, fix brand terms. Apply each change to en, zh-TW and zh-CN alike.`
    : `TASK: CREATE A NEW PLAYBOOK
${idea || instruction ? ideaBlock : `Source: ${source}. No extra instructions: draft from the form values.`}
Follow HOW TO DESIGN A PLAYBOOK from step A. Suggest a clear, specific title if the form title is empty.`;

  return `${guide || DEFAULT_DRAFT_GUIDE}

${head}

${task}

LANGUAGE CONSISTENCY: write the English profile first, then translate it 1-to-1 into zh-TW and zh-CN with the same number of steps, the same sections and the same {{VARIABLE}} keys.

OUTPUT: only a raw JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "id": "snake_case_id_based_on_the_title",
  "categories": ["1-3 audience categories, from: ${CategoryCore.CATEGORY_IDS.join(' | ')}"],
  "features": ["only the features used, from: ${FEATURE_NAMES.join(', ')}"],
  "connectors": [],
  "promptType": "one of: ${PROMPT_TYPES.join(' | ')}",
  "designNotes": "1-3 sentences in English: which features you chose and why",
  "timing": ["any of: anytime, sem_start, teaching, midterm, finals, winter, summer"],
  "hints": [
    { "en": "Drowning in essays to mark?", "zh-TW": "批改論文批改到喘不過氣？", "zh-CN": "批改论文批改到喘不过气？", "audience": ["Lecturer", "TA"] }
  ],
  "helperPrompts": {
    "en":    [{ "type": "canvas", "title": "Prompt to ...", "prompt": "..." }],
    "zh-TW": [{ "type": "canvas", "title": "...提示詞", "prompt": "..." }],
    "zh-CN": [{ "type": "canvas", "title": "...提示词", "prompt": "..." }]
  },
  "en":    { "title": "...", "summary": "...", "steps": ["...", "...", "..."], "prompt": "...", "proTip": "..." },
  "zh-TW": { "title": "...", "summary": "...", "steps": ["...", "...", "..."], "prompt": "...", "proTip": "..." },
  "zh-CN": { "title": "...", "summary": "...", "steps": ["...", "...", "..."], "prompt": "...", "proTip": "..." }
}
Field notes: "hints" holds exactly 2 short pain-point questions (at most 60 characters in English) that the target audience would ask and this playbook answers; "audience" uses these role names: ${QuestCore.ROLES.join(', ')}. Category ids: ${CategoryCore.CATEGORIES.map(c => `${c.id} = ${c.label.en} (${c.roles.join(', ')})`).join('; ')}. "summary" is 1-2 sentences on the outcome. "proTip" is one practical sentence.`;
};

// --- Super admin: playbook drafting prompt (Admin → Settings → Playbook drafting prompt) ---
app.get('/api/admin/settings/draft-prompt', requireSuper, async (req, res) => {
  const g = await readDraftGuide();
  res.json({ success: true, text: g.text, defaultText: DEFAULT_DRAFT_GUIDE, isDefault: g.isDefault, updatedBy: g.updatedBy, updatedAt: g.updatedAt, maxLength: DRAFT_PROMPT_MAX });
});

app.put('/api/admin/settings/draft-prompt', requireSuper, async (req, res) => {
  const text = typeof (req.body && req.body.text) === 'string' ? req.body.text.trim() : '';
  if (text.length < 200) return res.status(400).json({ success: false, message: 'The prompt is too short. Use Reset to default to start again.' });
  if (text.length > DRAFT_PROMPT_MAX) return res.status(400).json({ success: false, message: `Keep the prompt under ${DRAFT_PROMPT_MAX} characters.` });
  try {
    await mailer.writeSetting(query, DRAFT_PROMPT_SETTING_KEY, { text }, req.session.user.email);
    const g = await readDraftGuide();
    res.json({ success: true, text: g.text, isDefault: g.isDefault, updatedBy: g.updatedBy, updatedAt: g.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save the prompt.' });
  }
});

app.delete('/api/admin/settings/draft-prompt', requireSuper, async (req, res) => {
  try {
    await query('DELETE FROM app_settings WHERE key = ?', [DRAFT_PROMPT_SETTING_KEY]);
    res.json({ success: true, text: DEFAULT_DRAFT_GUIDE, isDefault: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset the prompt.' });
  }
});

// Admin: draft a new playbook or refine an existing one with Gemini (GEMINI_MODEL, service-account auth).
// The reply is normalised (lib/draft-normalize.js) so {{VARIABLE}} tokens and enum values always match the portal.
app.post('/api/admin/generate-gemini', requireAdmin, async (req, res) => {
  const { id, title, categories, features, connectors, promptType } = req.body;
  const instruction = String(req.body.instruction || '').trim();
  const idea = String(req.body.idea || '').trim().slice(0, 4000);
  const origin = Object.prototype.hasOwnProperty.call(DRAFT_ORIGINS, req.body.origin) ? req.body.origin : 'manual';
  const clarifications = Array.isArray(req.body.clarifications) ? req.body.clarifications.slice(0, 5) : [];
  if (!title && !instruction && !idea) {
    return res.status(400).json({ success: false, message: 'Please specify either a playbook title or custom instructions so Gemini can draft relevant content.' });
  }

  try {
    let original = '';
    if (id) {
      const existing = await query('SELECT * FROM use_cases WHERE id = ?', [id]);
      if (existing && existing.length > 0) {
        const uc = existing[0];
        original = JSON.stringify({
          id: uc.id,
          categories: CategoryCore.normalizeCategories(uc.categories),
          features: JSON.parse(uc.features || '[]'),
          connectors: JSON.parse(uc.connectors || '[]'),
          promptType: uc.prompt_type || 'general',
          timing: JSON.parse(uc.timing || '["anytime"]'),
          translations: JSON.parse(uc.translations || '{}'),
          helperPrompts: parseHelperPrompts(uc.helper_prompts) || {}
        }, null, 2);
      }
    }

    const promptText = buildDraftPrompt({
      form: { title, categories, features, connectors, promptType },
      original,
      instruction,
      origin,
      idea,
      clarifications,
      guide: (await readDraftGuide()).text
    });
    const parsedResult = normalizeDraft(await callGeminiJson(promptText));
    res.json({ success: true, result: parsedResult });
  } catch (error) {
    if (error.status) {
      // Upstream / parse failures keep the response shape the admin UI already understands
      return res.status(error.status).json({ success: false, error: error.message, ...(error.raw ? { raw: error.raw } : {}) });
    }
    console.error('Gemini content generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Sends one prompt to Gemini (GEMINI_MODEL on Vertex AI, service-account auth) and returns the parsed JSON reply.
 * Strips ```json fences if the model adds them despite instructions. Throws an Error carrying `.status`
 * (upstream HTTP status, or 500 for empty / unparsable output) and `.raw` (model text) for callers to map.
 */
async function callGeminiJson(promptText) {
  const url = `https://aiplatform.googleapis.com/v1/projects/${await getProjectId()}/locations/global/publishers/google/models/${GEMINI_MODEL}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: await gcpHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      contents: {
        role: 'USER',
        parts: [{ text: promptText }]
      },
      // JSON mode: the model must emit a single valid JSON value (long multilingual drafts
      // occasionally broke string escaping in free-text mode)
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw Object.assign(new Error(`Gemini API returned error: ${errText}`), { status: response.status });
  }

  const data = await response.json();
  // Thinking models may return several parts; join the text parts
  let text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  if (!text) {
    throw Object.assign(new Error('Empty response returned from Gemini.'), { status: 500 });
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

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON. Raw response:', text);
    throw Object.assign(new Error('Failed to parse Gemini response as JSON. Please try again.'), { status: 500, raw: text });
  }
}

// Admin News: translate an English title/body into zh-TW and zh-CN (product names stay English).
app.post('/api/admin/translate', requireAdmin, async (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  if (!title && !body) {
    return res.status(400).json({ success: false, message: 'Enter an English title or message to translate.' });
  }
  const promptText = `
Translate this short in-app announcement for a university portal from English into Traditional Chinese (Hong Kong usage, "zh-TW") and Simplified Chinese ("zh-CN").
Rules:
1. Keep ALL product and feature names (e.g. "Gemini Enterprise", "Gemini", "Gemini Notebook", "Canvas Mode", "Deep Research", "Agent Designer", "Skills", "Image Generation", "Video Generation") in ENGLISH.
2. Never use the term "Gem" (use "Agent"). Never use the term "Copilot".
3. Keep it concise: titles at most 30 Chinese characters, messages at most 80 Chinese characters.
4. Output ONLY raw JSON, no markdown fences, exactly: {"zh-TW":{"title":"...","body":"..."},"zh-CN":{"title":"...","body":"..."}}

English title: ${JSON.stringify(title)}
English message: ${JSON.stringify(body)}
`;
  try {
    const out = await callGeminiJson(promptText);
    const pick = (lang) => ({
      title: String(out?.[lang]?.title || '').slice(0, 60),
      body: String(out?.[lang]?.body || '').slice(0, 140)
    });
    res.json({ success: true, result: { 'zh-TW': pick('zh-TW'), 'zh-CN': pick('zh-CN') } });
  } catch (error) {
    console.error('Gemini translate error:', error.message);
    res.status(502).json({ success: false, message: 'Translation is unavailable right now. Try again or type the translations yourself.' });
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
