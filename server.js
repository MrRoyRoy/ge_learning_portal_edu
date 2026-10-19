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
const QuestCore = require('./lib/quest-core');
const { normalizeDraft, plainStepsForCase } = require('./lib/draft-normalize');
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
    // 'general' | 'notebooklm' | 'deep_research' | 'agent_designer' | 'canvas' | 'image' | 'video'
    { table: 'use_cases', column: 'prompt_type', pg: "VARCHAR(50) DEFAULT 'general'", sqlite: "TEXT DEFAULT 'general'" },
    // Quest Run: JSON array of academic phases when this playbook is most relevant (see lib/quest-core.js TIMINGS)
    { table: 'use_cases', column: 'timing', pg: `TEXT DEFAULT '["anytime"]'`, sqlite: `TEXT DEFAULT '["anytime"]'` },
    // Set up helper prompts: JSON { en: [{type,title,prompt}], 'zh-TW': [...], 'zh-CN': [...] }; NULL = never set
    { table: 'use_cases', column: 'helper_prompts', pg: 'TEXT', sqlite: 'TEXT' }
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
    await applySeedPromptTypes();
    // Idempotent fix-up: the old admin form saved "admin"; the portal filters on "administrative"
    await query("UPDATE use_cases SET category = 'administrative' WHERE category = 'admin'");
    await applyProductRename();
    await applySeedInfographics();
    await applySeedTiming();
    await applySeedQuestHints();
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
  special_consideration_workflow: 'agent_designer',   // Drive folder-triggered triage workflow with routing + staff review
  scholarship_application_workflow: 'agent_designer'  // form-triggered, forward-only coach workflow + mentor review
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

const PROMPT_TYPES = Object.freeze(['general', 'notebooklm', 'deep_research', 'agent_designer', 'canvas', 'image', 'video']);
const TEST_USER_GE_APP_LINK = 'https://your-gemini-enterprise-app-link';

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
  special_consideration_workflow: { timing: ['midterm', 'finals'], hints: [
    ['Extension requests piling up before exams?', '考試前延期申請堆積如山？', '考试前延期申请堆积如山？', ['SAO']],
    ['Want every special case checked by a person?', '想每宗特殊個案都有真人把關？', '想每份特殊个案都有真人把关？', ['SAO', 'Dean'], ['anytime']]
  ] },
  scholarship_application_workflow: { timing: ['sem_start', 'summer'], hints: [
    ['Scholarship deadline coming up?', '獎學金截止日期快到了？', '奖学金截止日期快到了？', ['Student']],
    ['Not sure your personal statement is strong enough?', '不肯定你的個人陳述夠不夠好？', '不确定你的个人陈述够不够好？', ['Student'], ['anytime']]
  ] }
});

/** INSERT that resolves to the new row id on both dialects (pg needs RETURNING; sqlite reports lastID). */
async function insertReturningId(sql, params, run = query) {
  const result = await run(dbType === 'postgres' ? `${sql} RETURNING id` : sql, params);
  return dbType === 'postgres' ? result[0].id : result.lastID;
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
  visual_campaign: 1791780081, workforce_federation: 1791780116,
  special_consideration_workflow: 1792321002, scholarship_application_workflow: 1792320981
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
        infographicUrl: uc.infographic_url || null,
        promptType: PROMPT_TYPES.includes(uc.prompt_type) ? uc.prompt_type : 'general',
        timing: parseTiming(uc.timing),
        helperPrompts: parseHelperPrompts(uc.helper_prompts),
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
      INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations, prompt_type, infographic_url, timing, helper_prompts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Steps never keep {{VARIABLES}} (they are shown as-is, only prompts are substituted)
    const fixed = plainStepsForCase({
      steps: uc.steps || [],
      translations: uc.translations || { en: uc, 'zh-TW': {}, 'zh-CN': {} }
    });

    const params = [
      uc.id,
      uc.category,
      uc.title,
      uc.summary,
      JSON.stringify(uc.features || []),
      JSON.stringify(uc.connectors || []),
      uc.role,
      JSON.stringify(uc.level || []),
      JSON.stringify(fixed.steps),
      uc.prompt,
      uc.proTip || '',
      uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
      JSON.stringify(fixed.translations),
      uc.promptType || 'general',
      importedInfographic.ok ? importedInfographic.value : null,
      JSON.stringify(timingCheck.value || ['anytime']),
      helperCheck.value ? JSON.stringify(helperCheck.value) : null
    ];

    await query(insertSql, params);
    if (hintsCheck.value) await replaceHints(uc.id, hintsCheck.value);
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
    // prompt_type / timing / helper_prompts = COALESCE(?, column): omitting the field keeps the stored value
    // ({} clears helper prompts, because it is a non-NULL value)
    const updateSql = `
      UPDATE use_cases
      SET category = ?, title = ?, summary = ?, features = ?, connectors = ?, role = ?, level = ?, steps = ?, prompt = ?, pro_tip = ?, connector_guide = ?, translations = ?, prompt_type = COALESCE(?, prompt_type), timing = COALESCE(?, timing), helper_prompts = COALESCE(?, helper_prompts), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    // Steps never keep {{VARIABLES}} (they are shown as-is, only prompts are substituted)
    const fixed = plainStepsForCase({ steps: uc.steps || [], translations: uc.translations || {} });

    const params = [
      uc.category,
      uc.title,
      uc.summary,
      JSON.stringify(uc.features || []),
      JSON.stringify(uc.connectors || []),
      uc.role,
      JSON.stringify(uc.level || []),
      JSON.stringify(fixed.steps),
      uc.prompt,
      uc.proTip || '',
      uc.connectorGuide ? JSON.stringify(uc.connectorGuide) : null,
      JSON.stringify(fixed.translations),
      uc.promptType || null,
      timingCheck.value ? JSON.stringify(timingCheck.value) : null,
      helperCheck.value ? JSON.stringify(helperCheck.value) : null,
      uc.id
    ];

    await query(updateSql, params);
    if (hintsCheck.value) await replaceHints(uc.id, hintsCheck.value);
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
 * Everything the Quest Run strip needs in one call. Standard users get their own role; admins
 * previewing the portal may pass ?role= (defaults to Lecturer). Hints are filtered to active ones
 * whose audience includes the role, with timing resolved (hint timing, else the use case timing).
 * News is filtered to active items for the role that have not clearly expired; the client applies
 * the exact local-date window with QuestCore.newsStatus().
 */
app.get('/api/quest', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(401).json({ success: false, code: 'session_expired', message: 'Your session has expired. Sign in again.' });
  try {
    const requested = String(req.query.role || '');
    const role = user.isAdmin
      ? (QuestCore.ROLES.includes(requested) ? requested : 'Lecturer')
      : (QuestCore.ROLES.includes(user.role) ? user.role : 'Lecturer');
    const calendar = await readAcademicCalendar();
    const now = new Date();
    const position = QuestCore.getAcademicPosition(now, calendar);

    const cases = await query('SELECT id, timing FROM use_cases');
    const timingByCase = Object.fromEntries(cases.map(c => [c.id, parseTiming(c.timing)]));
    const hints = (await query('SELECT * FROM quest_hints WHERE active = 1 ORDER BY id ASC'))
      .map(formatHintRow)
      .filter(h => timingByCase[h.useCaseId] && QuestCore.audienceIncludes(h.audience, role))
      .map(h => ({ id: h.id, useCaseId: h.useCaseId, question: h.question, audience: h.audience, timing: h.timing || timingByCase[h.useCaseId] }));

    // Server-side filter is deliberately loose (one day of slack for time zones); the client is exact.
    const yesterday = QuestCore.localDateIso(new Date(now.getTime() - 86400000));
    const news = (await query('SELECT * FROM announcements WHERE active = 1 ORDER BY pinned DESC, id DESC'))
      .map(formatAnnouncementRow)
      .filter(n => QuestCore.audienceIncludes(n.audience, role) && (!n.endsAt || n.endsAt >= yesterday))
      .map(({ id, title, body, linkUrl, useCaseId, pinned, startsAt, endsAt, active }) => ({ id, title, body, linkUrl, useCaseId, pinned, startsAt, endsAt, active }));

    res.json({
      success: true, role, heroClass: QuestCore.heroClassForRole(role),
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

/**
 * Conventions every drafted playbook must follow, shared by "create" and "refine".
 * Mirrors the seeded playbooks in app.js so admin-made playbooks look and behave the same.
 */
const DRAFT_CONVENTIONS = `
PLAYBOOK CONVENTIONS (match the portal's existing playbooks exactly):
1. VARIABLES: write every fill-in value as {{UPPER_SNAKE_CASE}}, e.g. {{COURSE_NAME}}, {{INSTITUTION_NAME}}, {{TARGET_AUDIENCE}}. Use 2-6 variables. Never use square brackets such as [COURSE_NAME]. Use the SAME English variable keys in en, zh-TW and zh-CN; never translate a key. Variables belong ONLY in the prompt and Set up prompts (the portal substitutes them there); NEVER put a {{VARIABLE}} in "steps", because steps are shown as-is. In steps write plain words instead, e.g. "your department", "your course" (zh-TW 你的科系 / 你的課程, zh-CN 你的院系 / 你的课程).
2. STEPS: exactly 3 steps of one or two sentences each, with no {{VARIABLES}}, in this order:
   (1) Set up and ground: what to prepare, which files to add and which feature to open.
   (2) Run: use the sample prompt in the named feature.
   (3) Review and deliver: what a person checks before the result is shared.
3. PROMPT: a ready-to-paste prompt for the main feature. Open with the role ("You are ..." or "Act as ..."), use numbered or labelled sections, and describe the expected output. If the prompt should produce a document, end it with: "Use Canvas to create this as an editable document." Exception: never add the Canvas sentence or "in Canvas Mode" to Agent Designer instructions (promptType agent_designer); the Agent replies with structured text (headings, tables) and Canvas Mode is only used by Set up prompts run in Gemini.
4. PROMPT TYPE ("promptType"), one of: general | notebooklm | deep_research | agent_designer | canvas | image | video. Match the feature the prompt is pasted into: Agent Designer -> agent_designer, Gemini Notebook -> notebooklm, Deep Research -> deep_research, Canvas Mode -> canvas, Image Generation -> image, Video Generation -> video, anything else -> general.
5. AGENT DESIGNER WORKFLOWS (promptType agent_designer with several steps): label each step "STEP n · NAME (node type)"; write branches as "IF ... → go to Step n"; keep the flow forward-only (never loop back to an earlier step); give approval nodes exactly two outcomes, Approve or Reject; start the run from a trigger (for example a new file in a folder) or a form; attach reference files as Knowledge Sources on agent nodes and never ask for file uploads during a run; include a human review step before anything reaches a student or the public.
6. CONNECTORS: list one only when the playbook really reads live data from that system, otherwise return []. Use these names exactly: "Drive Connector", "Email Connector", "LMS Connector", "Calendar Connector".
7. WRITING: plain, friendly English with short sentences. zh-TW is Traditional Chinese as written in Hong Kong; zh-CN is Simplified Chinese. Keep product names in English inside Chinese text: Gemini, Gemini Enterprise, Gemini Notebook, Canvas Mode, Deep Research, Agent Designer, Image Generation, Video Generation and the connector names.
8. BRAND: never say "Gem" (always "Agent") and never say "Copilot".
9. SET UP PROMPTS ("helperPrompts"): 1-3 short ready-to-paste prompts that prepare what step 1 needs (sample data, a rules table, a template, a source summary). Each has a title starting "Prompt to ..." (zh-TW / zh-CN titles end with 提示詞 / 提示词), a type from the PROMPT TYPE list, and reuses the main prompt's {{VARIABLE}} keys where they fit. If a set up prompt creates a document, set type "canvas" and end it with the Canvas sentence in that language: en "Use Canvas to create this as an editable document.", zh-TW "請使用 Canvas 將此內容建立為可編輯文件。", zh-CN "请使用 Canvas 将此内容创建为可编辑文档。" Keep the same number and order of entries in en, zh-TW and zh-CN.
10. GROUNDING: Agent Designer cannot read a Gemini Notebook and there is no notebook connector. When a playbook prepares sources in Gemini Notebook and then builds an Agent, step 1 or 2 must tell the user to add the same files under "Agent Designer › Knowledge › Add files" (same file names, so citations match), and use the notebook to check the Agent's answers. A prompt that relies on files must include a "KNOWLEDGE SOURCES" section (what the files are) and "GROUNDING RULES": use only those sources, cite the file and page / slide / section, say clearly when something isn't covered (and who to ask), never invent facts, figures or quotes. Never write "manually upload ... into the system instructions" or "connect Gemini Notebook to the Agent". Gemini Notebook cannot run Deep Research: run Deep Research in Gemini first, then add the report to the notebook as a source.
11. CONSISTENCY: every listed GE feature and connector must be used in a step or in the prompt; remove any that are not. A connector-based prompt names the connector as its data source and never searches the web for personal data. Prompts that analyse sources or data must require evidence (citations or data points) and say what to do when evidence is missing.
`;

/**
 * Build the drafting brief. Pure.
 * @param {object} form        current case-form values (title, category, role, level, features, connectors, promptType)
 * @param {string} original    JSON of the stored playbook when refining, '' when creating
 * @param {string} instruction admin's free-text request (may be empty)
 */
const buildDraftPrompt = ({ form, original, instruction }) => {
  const head = `You are the Playbook Architect for "Gemini Enterprise - Edu Portal", a library of ready-to-use Gemini Enterprise playbooks for schools and universities.

CURRENT FORM VALUES
- Title: ${JSON.stringify(form.title || '')}
- Category: ${JSON.stringify(form.category || 'academic')}
- Role: ${JSON.stringify(form.role || 'Lecturer')}
- School levels: ${JSON.stringify(form.level || [])}
- GE features: ${JSON.stringify(form.features || [])}
- Connectors: ${JSON.stringify(form.connectors || [])}
- Prompt type: ${JSON.stringify(form.promptType || 'general')}
`;

  const task = original
    ? `TASK: REFINE AN EXISTING PLAYBOOK
Stored playbook (all languages):
${original}

Admin instructions: ${JSON.stringify(instruction || 'Tidy the playbook so it follows the conventions below.')}

Apply only the changes the instructions ask for (helperPrompts included: echo the stored ones unchanged unless asked, or draft 1-3 if there are none), plus these always-allowed fixes: convert [VARIABLE] placeholders to {{VARIABLE}}, keep variable keys identical across languages, and fix brand terms. Keep every other title, summary, step, prompt and tip as it is and echo the unchanged text back. Apply each change to en, zh-TW and zh-CN alike.`
    : `TASK: DRAFT A NEW PLAYBOOK
${instruction ? `Admin instructions (highest priority): ${JSON.stringify(instruction)}` : 'No extra instructions: draft from the form values.'}
Suggest a clear, specific title if the form title is empty.`;

  return `${head}
${task}
${DRAFT_CONVENTIONS}
LANGUAGE CONSISTENCY: write the English profile first, then translate it 1-to-1 into zh-TW and zh-CN with the same number of steps, the same sections and the same {{VARIABLE}} keys.

OUTPUT: only a raw JSON object (no markdown fences, no commentary) with exactly these keys:
{
  "id": "snake_case_id_based_on_the_title",
  "category": "one of: academic | student | operational | administrative",
  "role": "one of: Lecturer | TA | Student | Program Leader | Dean | IT Admin | SAO | Security | Finance",
  "features": ["only the features used, from: Agent Designer, Gemini Notebook, Deep Research, Canvas Mode, Image Generation, Video Generation"],
  "connectors": [],
  "promptType": "one of: general | notebooklm | deep_research | agent_designer | canvas | image | video",
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
Field notes: "hints" holds exactly 2 short pain-point questions (at most 60 characters in English) that the target audience would ask and this playbook answers; "audience" uses the role names above. "summary" is 1-2 sentences on the outcome. "proTip" is one practical sentence.`;
};

// Admin: draft a new playbook or refine an existing one with Gemini (GEMINI_MODEL, service-account auth).
// The reply is normalised (lib/draft-normalize.js) so {{VARIABLE}} tokens and enum values always match the portal.
app.post('/api/admin/generate-gemini', requireAdmin, async (req, res) => {
  const { id, title, category, features, connectors, role, level, promptType } = req.body;
  const instruction = String(req.body.instruction || '').trim();
  if (!title && !instruction) {
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
          category: uc.category,
          role: uc.role,
          level: JSON.parse(uc.level || '[]'),
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
      form: { title, category, role, level, features, connectors, promptType },
      original,
      instruction
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
  const url = `https://aiplatform.googleapis.com/v1/projects/your-gcp-project-id/locations/global/publishers/google/models/${GEMINI_MODEL}:generateContent`;
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
    throw Object.assign(new Error(`Gemini API returned error: ${errText}`), { status: response.status });
  }

  const data = await response.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
1. Keep ALL product and feature names (e.g. "Gemini Enterprise", "Gemini", "Gemini Notebook", "Canvas Mode", "Deep Research", "Agent Designer", "Image Generation", "Video Generation") in ENGLISH.
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
