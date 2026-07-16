/* server.js - Dynamic Express Backend with Dual Database Support (PostgreSQL / SQLite) */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Body Parsers and Static Asset Delivery
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Management
app.use(session({
  secret: process.env.SESSION_SECRET || 'edu-gemini-enterprise-swiss-minimalist-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production if running behind HTTPS/SSL
    maxAge: 24 * 60 * 60 * 1000 // 1 day session longevity
  }
}));

// Serve static assets from project root and public subdirectories
app.use(express.static(__dirname));

// ==========================================
// 1. Database Connection & Table Schema Setup
// ==========================================
let dbType = 'sqlite';
let pgPool = null;
let sqliteDb = null;

const pgConnectionString = process.env.DATABASE_URL;

if (pgConnectionString) {
  const { Pool } = require('pg');
  const useSSL = process.env.NODE_ENV === 'production' && process.env.DISABLE_PG_SSL !== 'true';
  pgPool = new Pool({
    connectionString: pgConnectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  });
  dbType = 'postgres';
  console.log('⚡ Using Cloud/Production PostgreSQL Connection Layer.');
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'edu_portal.db');
  sqliteDb = new sqlite3.Database(dbPath);
  dbType = 'sqlite';
  console.log(`⚡ Using Local File-Based SQLite Fallback DB: ${dbPath}`);
}

// Database query wrapper function to unify Postgres pool and SQLite connections
function query(sql, params = []) {
  if (dbType === 'postgres') {
    // Dynamically convert SQLite "?" placeholders to PostgreSQL "$1", "$2", etc.
    let index = 1;
    let convertedSql = sql;
    while (convertedSql.includes('?')) {
      convertedSql = convertedSql.replace('?', `$${index}`);
      index++;
    }
    return pgPool.query(convertedSql, params).then(res => res.rows);
  } else {
    return new Promise((resolve, reject) => {
      // Differentiate between mutation queries (run) and retrieval queries (all)
      const isMutation = sql.trim().toUpperCase().startsWith('INSERT') || 
                         sql.trim().toUpperCase().startsWith('UPDATE') || 
                         sql.trim().toUpperCase().startsWith('DELETE') ||
                         sql.trim().toUpperCase().startsWith('REPLACE') ||
                         sql.trim().toUpperCase().startsWith('CREATE');
      
      if (isMutation) {
        sqliteDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      } else {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      }
    });
  }
}

// Dynamic OAuth Access Token helper for GCP metadata or local gcloud fallback
async function getGcpAccessToken() {
  try {
    // 1. Try local Metadata Server (GCP environment)
    const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    }
  } catch (err) {
    // Fallback to command line
  }

  try {
    // 2. Try application-default (ADC)
    const { execSync } = require('child_process');
    return execSync('gcloud auth application-default print-access-token').toString().trim();
  } catch (err) {
    try {
      const { execSync } = require('child_process');
      return execSync('gcloud auth print-access-token').toString().trim();
    } catch (e) {
      throw new Error('Failed to retrieve a valid Google Cloud access token.');
    }
  }
}

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
      action VARCHAR(50) NOT NULL, -- 'view', 'like', 'deploy'
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

  const createCheckpointsTable = dbType === 'postgres' ? `
    CREATE TABLE IF NOT EXISTS verification_checkpoints (
      id VARCHAR(100) PRIMARY KEY,
      role VARCHAR(100) NOT NULL,
      phase VARCHAR(50) NOT NULL,
      text TEXT NOT NULL,
      text_zh TEXT NOT NULL
    );
  ` : `
    CREATE TABLE IF NOT EXISTS verification_checkpoints (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      phase TEXT NOT NULL,
      text TEXT NOT NULL,
      text_zh TEXT NOT NULL
    );
  `;

  await query(createUsersTable);
  await query(createUseCasesTable);
  await query(createPreferencesTable);
  await query(createAnalyticsTable);
  await query(createFeedbacksTable);
  await query(createCheckpointsTable);

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
      globalThis.seed_roleVerificationCheckpoints = roleVerificationCheckpoints;
    `;

    vm.runInNewContext(seedExtractScript, sandbox);

    const useCases = sandbox.seed_useCasesDb;
    const translations = sandbox.seed_useCasesTranslations;
    const checkpointsData = sandbox.seed_roleVerificationCheckpoints;

    if (!useCases || !translations) {
      throw new Error('Failed to extract useCasesDb or useCasesTranslations from sandbox context.');
    }

    if (count === 0) {
      console.log(`🌱 Database is empty. Seeding all ${useCases.length} use cases from app.js...`);
      for (const uc of useCases) {
        await insertUseCase(uc, translations[uc.id]);
      }
      console.log('✅ Use cases database seeded successfully.');
    } else {
      console.log('📊 Database already contains seeded use cases. Synchronizing "su_helpdesk" dual-mode prompt configurations...');
      const suHelpdesk = useCases.find(uc => uc.id === 'su_helpdesk');
      if (suHelpdesk) {
        await query("DELETE FROM use_cases WHERE id = 'su_helpdesk'");
        await insertUseCase(suHelpdesk, translations['su_helpdesk']);
        console.log('✅ "su_helpdesk" dual-mode prompt configurations synchronized successfully.');
      }
    }

    // Seed verification checkpoints if empty
    const existingCheckpoints = await query('SELECT count(*) as count FROM verification_checkpoints');
    const checkpointCount = parseInt(existingCheckpoints[0].count || existingCheckpoints[0]['count(*)'] || 0);

    if (checkpointsData && checkpointCount === 0) {
      console.log('🌱 Seeding verification checkpoints database from app.js...');
      for (const [role, phases] of Object.entries(checkpointsData)) {
        for (const [phase, items] of Object.entries(phases)) {
          for (const item of items) {
            await query(
              'INSERT INTO verification_checkpoints (id, role, phase, text, text_zh) VALUES (?, ?, ?, ?, ?)',
              [item.id, role, phase, item.text, item.textZh || item.text]
            );
          }
        }
      }
      console.log('✅ Verification checkpoints database seeded successfully.');
    }

    // Clean up any previously pre-seeded mock analytics data to reflect actual adoption metrics
    await query("DELETE FROM analytics WHERE user_email = 'academic_trial@edu.hk'");

    // Seed standard trial user test-user@google.com with password 12345678 if missing
    const existingTestUser = await query('SELECT count(*) as count FROM users WHERE email = ?', ['test-user@google.com']);
    const testUserCount = parseInt(existingTestUser[0].count || existingTestUser[0]['count(*)'] || 0);
    if (testUserCount === 0) {
      console.log('👤 Seeding default user: test-user@google.com with password: 12345678');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('12345678', salt);
      await query(
        'INSERT INTO users (email, password_hash, is_temp_password, role, institution_level) VALUES (?, ?, ?, ?, ?)',
        ['test-user@google.com', hash, 0, 'Lecturer', 'University & College']
      );
    }

  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
  }
}

async function insertUseCase(uc, ucTranslations) {
  const translationsObj = ucTranslations || { en: uc, 'zh-TW': {}, 'zh-CN': {} };
  const insertSql = `
    INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    JSON.stringify(translationsObj)
  ];

  await query(insertSql, params);
}

// Generate premium mock analytics trend lines for the last 6 months
async function seedAnalytics() {
  const existingLogs = await query('SELECT count(*) as count FROM analytics');
  const logCount = parseInt(existingLogs[0].count || existingLogs[0]['count(*)'] || 0);

  if (logCount > 0) return;

  console.log('📈 Seeding realistic monthly analytics logs for the last 6 months...');
  const actions = ['view', 'like', 'deploy'];
  const useCaseIds = ['socratic_tutor', 'rubric_grading', 'curriculum_design', 'lab_manual_creator', 'su_advocacy'];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    
    // Distribute events realistically: views > likes > deployments
    const counts = { view: 60 + Math.floor(Math.random() * 50), like: 15 + Math.floor(Math.random() * 15), deploy: 5 + Math.floor(Math.random() * 8) };

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

// Login Handler
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
  }

  // Admin bypass credentials
  if (email.trim() === 'edu_portal_s_admin' && password === 'HKEduDemo2026') {
    req.session.user = { email: 'edu_portal_s_admin', isAdmin: true, isAssist: false };
    return res.json({ success: true, isAdmin: true });
  }

  // Admin Assist bypass credentials
  if (email.trim() === 'edu_portal_admin' && password === 'HKEduDemo') {
    req.session.user = { email: 'edu_portal_admin', isAdmin: true, isAssist: true };
    return res.json({ success: true, isAdmin: true });
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
      isTemp: isTemp,
      role: user.role,
      institutionLevel: user.institution_level
    };

    res.json({
      success: true,
      isAdmin: false,
      isTemp: isTemp,
      email: user.email,
      role: user.role,
      institutionLevel: user.institution_level
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
app.get('/api/auth/session', (req, res) => {
  if (req.session.user) {
    res.json({ success: true, loggedIn: true, user: req.session.user });
  } else {
    res.json({ success: false, loggedIn: false });
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
    
    // Retrieve aggregated count of likes from user_preferences table
    const likesRes = await query('SELECT use_case_id, COUNT(*) as total_likes FROM user_preferences WHERE is_liked = true GROUP BY use_case_id');
    const likesMap = {};
    likesRes.forEach(l => {
      likesMap[l.use_case_id] = parseInt(l.total_likes, 10);
    });

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
        advancedSteps: enTrans.advancedSteps || null,
        prompt: uc.prompt,
        advancedPrompt: enTrans.advancedPrompt || null,
        proTip: uc.pro_tip,
        advancedProTip: enTrans.advancedProTip || null,
        connectorGuide: uc.connector_guide ? JSON.parse(uc.connector_guide) : null,
        translations: transObj,
        isVerified: uc.is_verified === true || uc.is_verified === 1 || uc.is_verified === 'true',
        isLiked: false,
        isDeployed: false,
        totalLikes: likesMap[uc.id] || 0,
        createdAt: uc.created_at,
        updatedAt: uc.updated_at
      };
    });

    // If an authorized standard user is logged in, fetch their specific preferences
    if (req.session.user && !req.session.user.isAdmin) {
      const email = req.session.user.email;
      const prefs = await query('SELECT * FROM user_preferences WHERE user_email = ?', [email]);
      
      const prefMap = {};
      prefs.forEach(p => {
        prefMap[p.use_case_id] = {
          isLiked: p.is_liked === 1 || p.is_liked === true,
          isDeployed: p.is_deployed === 1 || p.is_deployed === true
        };
      });

      formattedUseCases.forEach(uc => {
        if (prefMap[uc.id]) {
          uc.isLiked = prefMap[uc.id].isLiked;
          uc.isDeployed = prefMap[uc.id].isDeployed;
        }
      });
    }

    res.json(formattedUseCases);
  } catch (error) {
    console.error('Error fetching use cases:', error);
    res.status(500).json({ error: 'Failed to retrieve use cases from server.' });
  }
});

// Toggle Like state
app.post('/api/use-cases/like', async (req, res) => {
  if (!req.session.user || req.session.user.isAdmin) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Standard user session required.' });
  }

  const { useCaseId, isLiked } = req.body;
  const email = req.session.user.email;

  try {
    // Perform an upsert (INSERT OR REPLACE)
    if (dbType === 'sqlite') {
      await query(`
        INSERT INTO user_preferences (user_email, use_case_id, is_liked)
        VALUES (?, ?, ?)
        ON CONFLICT(user_email, use_case_id) 
        DO UPDATE SET is_liked = excluded.is_liked
      `, [email, useCaseId, isLiked ? 1 : 0]);
    } else {
      await query(`
        INSERT INTO user_preferences (user_email, use_case_id, is_liked)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_email, use_case_id) 
        DO UPDATE SET is_liked = EXCLUDED.is_liked
      `, [email, useCaseId, isLiked]);
    }

    // Insert an analytics event tracking log
    await query(
      'INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)',
      [isLiked ? 'like' : 'unlike', useCaseId, email]
    );

    // Retrieve updated total count of likes for this use case
    const likeCountRes = await query(
      'SELECT COUNT(*) as total_likes FROM user_preferences WHERE use_case_id = ? AND is_liked = true',
      [useCaseId]
    );
    const totalLikes = likeCountRes[0] ? parseInt(likeCountRes[0].total_likes, 10) : 0;

    res.json({ success: true, totalLikes });
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ success: false, message: 'Database query error.' });
  }
});

// Toggle Deployment state
app.post('/api/use-cases/deploy', async (req, res) => {
  if (!req.session.user || req.session.user.isAdmin) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Standard user session required.' });
  }

  const { useCaseId, isDeployed } = req.body;
  const email = req.session.user.email;

  try {
    if (dbType === 'sqlite') {
      await query(`
        INSERT INTO user_preferences (user_email, use_case_id, is_deployed)
        VALUES (?, ?, ?)
        ON CONFLICT(user_email, use_case_id) 
        DO UPDATE SET is_deployed = excluded.is_deployed
      `, [email, useCaseId, isDeployed ? 1 : 0]);
    } else {
      await query(`
        INSERT INTO user_preferences (user_email, use_case_id, is_deployed)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_email, use_case_id) 
        DO UPDATE SET is_deployed = EXCLUDED.is_deployed
      `, [email, useCaseId, isDeployed]);
    }

    await query(
      'INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)',
      [isDeployed ? 'deploy' : 'undeploy', useCaseId, email]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Deploy toggle error:', error);
    res.status(500).json({ success: false, message: 'Database query error.' });
  }
});

// Increment Page Clicks / views
app.post('/api/use-cases/view', async (req, res) => {
  const { useCaseId } = req.body;
  const email = req.session.user ? req.session.user.email : 'anonymous';

  try {
    await query(
      'INSERT INTO analytics (action, use_case_id, user_email) VALUES (?, ?, ?)',
      ['view', useCaseId, email]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// List Feedbacks (Strictly Super-Admin ONLY)
app.get('/api/feedbacks', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.email !== 'edu_portal_s_admin') {
      return res.status(403).json({ error: 'Unauthorized access. Super-admin role required.' });
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
    if (!req.session.user || req.session.user.email !== 'edu_portal_s_admin') {
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

// User CRUD: Fetch all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await query('SELECT email, is_temp_password, created_at FROM users ORDER BY created_at DESC');
    const formattedUsers = users.map(u => ({
      email: u.email,
      isTemp: u.is_temp_password === 1 || u.is_temp_password === true,
      createdAt: u.created_at
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User CRUD: Add / Provision User
app.post('/api/admin/users', requireAdmin, async (req, res) => {
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

// User CRUD: Reset User password to a new temporary password
app.put('/api/admin/users/reset', requireAdmin, async (req, res) => {
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
});

// Analytics: Calculate 6-month historical dashboard stats
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const userCountRows = await query('SELECT count(*) as count FROM users');
    const totalUsers = parseInt(userCountRows[0].count || userCountRows[0]['count(*)'] || 0);

    const useCaseCountRows = await query('SELECT count(*) as count FROM use_cases');
    const totalUseCases = parseInt(useCaseCountRows[0].count || useCaseCountRows[0]['count(*)'] || 0);

    const preferenceStats = await query(`
      SELECT 
        SUM(CASE WHEN is_liked = true THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN is_deployed = true THEN 1 ELSE 0 END) as deployments
      FROM user_preferences
    `);

    const totalLikes = parseInt(preferenceStats[0].likes || 0);
    const totalDeployments = parseInt(preferenceStats[0].deployments || 0);

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
      const deployQuery = await query('SELECT count(*) as count FROM analytics WHERE action = ? AND timestamp >= ? AND timestamp <= ?', ['deploy', startStr, endStr]);

      historicalAnalytics.push({
        month: monthLabel,
        views: parseInt(viewQuery[0].count || viewQuery[0]['count(*)'] || 0),
        likes: parseInt(likeQuery[0].count || likeQuery[0]['count(*)'] || 0),
        deployments: parseInt(deployQuery[0].count || deployQuery[0]['count(*)'] || 0)
      });
    }

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
      totalDeployments,
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
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to create playbooks.' });
  }

  const uc = req.body;
  if (!uc.id || !uc.title || !uc.category) {
    return res.status(400).json({ success: false, message: 'Missing required use case parameter fields.' });
  }

  try {
    const isVerifiedVal = dbType === 'postgres' ? (uc.isVerified ? true : false) : (uc.isVerified ? 1 : 0);

    const insertSql = `
      INSERT INTO use_cases (id, category, title, summary, features, connectors, role, level, steps, prompt, pro_tip, connector_guide, translations, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      isVerifiedVal
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
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to modify playbooks.' });
  }

  const uc = req.body;
  if (!uc.id || !uc.title) {
    return res.status(400).json({ success: false, message: 'ID and Title are mandatory.' });
  }

  try {
    const isVerifiedVal = dbType === 'postgres' ? (uc.isVerified ? true : false) : (uc.isVerified ? 1 : 0);

    const updateSql = `
      UPDATE use_cases
      SET category = ?, title = ?, summary = ?, features = ?, connectors = ?, role = ?, level = ?, steps = ?, prompt = ?, pro_tip = ?, connector_guide = ?, translations = ?, is_verified = ?, updated_at = CURRENT_TIMESTAMP
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
      translations: JSON.parse(uc.translations || '{}')
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ge_adoption_use_cases.json');
    res.send(JSON.stringify(exportData, null, 2));

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin-Gemini: Optimize or Draft Playbooks with Gemini 3.5 Flash using Service Account Access
app.post('/api/admin/generate-gemini', requireAdmin, async (req, res) => {
  const { id, title, category, features, connectors, role, level, isDualMode, instruction } = req.body;
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

    const token = await getGcpAccessToken();
    const url = 'https://aiplatform.googleapis.com/v1/projects/ge-edu-demo/locations/global/publishers/google/models/gemini-3.5-flash:generateContent';

    let promptText = `
You are the AI Playbook Architect for "Gemini Enterprise - Edu Portal".
Generate a high-fidelity educational/operational playbook based on the following input parameters:
- Playbook Title: "${title || 'Suggest a professional, high-fidelity playbook title based on instructions'}"
- Category: "${category || 'academic'}"
- Gemini Features: ${JSON.stringify(features || [])}
- Connected Data Connectors: ${JSON.stringify(connectors || [])}
- Target User Role: "${role || 'Lecturer'}"
- Target Institutional Levels: ${JSON.stringify(level || [])}
- Enable Dual-Mode Connectors Workflow: ${isDualMode ? 'Yes' : 'No'}
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
  "features": ${JSON.stringify(features || [])},
  "en": {
    "title": "Suggested High-Fidelity English Title",
    "summary": "Detailed summary describing how this playbook uses Gemini to solve the target challenge.",
    "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
    "advancedSteps": ${isDualMode ? '["Advanced Step 1 using Connectors", "Advanced Step 2 using Connectors", "Advanced Step 3 using Connectors", "Advanced Step 4 using Connectors"]' : 'null'},
    "prompt": "Highly detailed model prompt that the user can copy and paste into Gemini.",
    "advancedPrompt": ${isDualMode ? '"Detailed advanced integration prompt..."' : 'null'},
    "proTip": "Helpful pro-tip for getting the best outcome from Gemini.",
    "advancedProTip": ${isDualMode ? '"Advanced pro-tip about data connectors..."' : 'null'}
  },
  "zh-TW": {
    "title": "繁體中文版高質量標題",
    "summary": "繁體中文版詳細描述...",
    "steps": ["繁體中文步驟 1", "繁體中文步驟 2", "繁體中文步驟 3", "繁體中文步驟 4"],
    "advancedSteps": ${isDualMode ? '["繁體中文進階步驟 1", "繁體中文進階步驟 2", "繁體中文進階步驟 3", "繁體中文進階步驟 4"]' : 'null'},
    "prompt": "繁體中文詳細提示詞...",
    "advancedPrompt": ${isDualMode ? '"繁體中文進階提示詞..."' : 'null'},
    "proTip": "繁體中文實用技巧...",
    "advancedProTip": ${isDualMode ? '"繁體中文進階實用技巧..."' : 'null'}
  },
  "zh-CN": {
    "title": "简体中文版高质量标题",
    "summary": "简体中文版详细描述...",
    "steps": ["简体中文步骤 1", "简体中文步骤 2", "简体中文步骤 3", "简体中文步骤 4"],
    "advancedSteps": ${isDualMode ? '["简体中文高级步骤 1", "简体中文高级步骤 2", "简体中文高级步骤 3", "简体中文高级步骤 4"]' : 'null'},
    "prompt": "简体中文详细提示词...",
    "advancedPrompt": ${isDualMode ? '"简体中文高级提示词..."' : 'null'},
    "proTip": "简体中文实用技巧...",
    "advancedProTip": ${isDualMode ? '"简体中文高级实用技巧..."' : 'null'}
  }
}

Brand Guidelines & Localisation Boundaries:
1. Keep ALL product and feature names (e.g. "NotebookLM", "Gemini", "Canvas Mode", "Deep Research", "Agent Designer", "Image Generation", "Video Generation", "Drive Connector", "Email Connector", "Calendar Connector", "LMS Connector") strictly in ENGLISH, even inside the Traditional Chinese ("zh-TW") and Simplified Chinese ("zh-CN") translations.
2. Never use the term "Gem" (always use "Agent"). Never use the term "Copilot".
3. Avoid generic red/blue/green references. Ensure suggestions are premium and tailored for educational excellence.
4. Output ONLY the raw JSON block. Do NOT surround it with markdown code blocks (such as \`\`\`json ... \`\`\`), HTML tags, or any other introductory or concluding commentary text.

`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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
// 5b. Phase Verification Checkpoints REST API
// ==========================================

// Get all verification checkpoints (Accessible to all authenticated users)
app.get('/api/checkpoints', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM verification_checkpoints ORDER BY role ASC, phase ASC, id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a verification checkpoint (Admin only)
app.post('/api/admin/checkpoints', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to modify verification checklists.' });
  }

  const { id, role, phase, text, text_zh } = req.body;
  if (!id || !role || !phase || !text) {
    return res.status(400).json({ success: false, message: 'Missing required parameters.' });
  }

  try {
    await query(
      'INSERT INTO verification_checkpoints (id, role, phase, text, text_zh) VALUES (?, ?, ?, ?, ?)',
      [id, role, phase, text, text_zh || text]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a verification checkpoint (Admin only)
app.put('/api/admin/checkpoints', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to modify verification checklists.' });
  }

  const { id, role, phase, text, text_zh } = req.body;
  if (!id || !role || !phase || !text) {
    return res.status(400).json({ success: false, message: 'Missing required parameters.' });
  }

  try {
    await query(
      'UPDATE verification_checkpoints SET role = ?, phase = ?, text = ?, text_zh = ? WHERE id = ?',
      [role, phase, text, text_zh || text, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a verification checkpoint (Admin only)
app.delete('/api/admin/checkpoints', requireAdmin, async (req, res) => {
  if (req.session.user.isAssist) {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative assistants are not authorized to modify verification checklists.' });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing required ID parameter.' });
  }

  try {
    await query('DELETE FROM verification_checkpoints WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
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
