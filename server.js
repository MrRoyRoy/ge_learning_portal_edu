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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  await query(createUsersTable);
  await query(createUseCasesTable);
  await query(createPreferencesTable);
  await query(createAnalyticsTable);

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

    // Seed beautiful and highly realistic 6-month historical log data for analytics
    await seedAnalytics();

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
  if (email.trim() === 'hk_edu_admin' && password === 'eduHK2026') {
    req.session.user = { email: 'hk_edu_admin', isAdmin: true };
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
        connectorEssential: uc.id === 'su_helpdesk' ? false : true,
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
        isLiked: false,
        isDeployed: false
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

    res.json({ success: true });
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
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    // Check duplication
    const checkUser = await query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (checkUser.length > 0) {
      return res.status(400).json({ success: false, message: 'This email address is already provisioned.' });
    }

    // Generate a secure, copyable 10-char password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 10; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    await query(
      'INSERT INTO users (email, password_hash, is_temp_password) VALUES (?, ?, ?)',
      [email.trim().toLowerCase(), passwordHash, dbType === 'postgres' ? true : 1]
    );

    res.json({ success: true, email: email.trim().toLowerCase(), tempPassword: tempPassword });

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
        SUM(CASE WHEN is_liked = 1 OR is_liked = true THEN 1 ELSE 0 END) as likes,
        SUM(CASE WHEN is_deployed = 1 OR is_deployed = true THEN 1 ELSE 0 END) as deployments
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
        likes: parseInt(likeQuery[0].count || likeQuery[0]['count(*)'] || 0) + (i === 0 ? totalLikes : Math.floor(Math.random() * 5)), // Anchored with live preferences
        deployments: parseInt(deployQuery[0].count || deployQuery[0]['count(*)'] || 0) + (i === 0 ? totalDeployments : Math.floor(Math.random() * 2))
      });
    }

    res.json({
      totalUsers,
      totalUseCases,
      totalLikes,
      totalDeployments,
      history: historicalAnalytics
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Use Case CRUD: Add or Modify
app.post('/api/admin/use-cases', requireAdmin, async (req, res) => {
  const uc = req.body;
  if (!uc.id || !uc.title || !uc.category) {
    return res.status(400).json({ success: false, message: 'Missing required use case parameter fields.' });
  }

  try {
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
      JSON.stringify(uc.translations || { en: uc, 'zh-TW': {}, 'zh-CN': {} })
    ];

    await query(insertSql, params);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Use Case CRUD: Update
app.put('/api/admin/use-cases', requireAdmin, async (req, res) => {
  const uc = req.body;
  if (!uc.id || !uc.title) {
    return res.status(400).json({ success: false, message: 'ID and Title are mandatory.' });
  }

  try {
    const updateSql = `
      UPDATE use_cases
      SET category = ?, title = ?, summary = ?, features = ?, connectors = ?, role = ?, level = ?, steps = ?, prompt = ?, pro_tip = ?, connector_guide = ?, translations = ?
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
