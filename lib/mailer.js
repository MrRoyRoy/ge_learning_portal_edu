/* lib/mailer.js - SMTP email delivery (config from Admin → Settings → Email, env bootstrap, or demo mode) */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { encrypt, tryDecrypt } = require('./secrets');

const SMTP_SETTINGS_KEY = 'smtp';
const SMTP_TEST_KEY = 'smtp_last_test';
const SECURITY_MODES = ['starttls', 'ssl', 'none'];

// ------------------------------------------
// Settings persistence (app_settings table)
// ------------------------------------------

const readSetting = async (query, key) => {
  const rows = await query('SELECT value, updated_by, updated_at FROM app_settings WHERE key = ?', [key]);
  if (!rows.length) return null;
  try {
    return { value: JSON.parse(rows[0].value), updatedBy: rows[0].updated_by, updatedAt: rows[0].updated_at };
  } catch (err) {
    return null;
  }
};

const writeSetting = (query, key, value, updatedBy) => query(`
  INSERT INTO app_settings (key, value, updated_by, updated_at)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP
`, [key, JSON.stringify(value), updatedBy || null]);

/**
 * Stored shape (app_settings['smtp'].value):
 *   { host, port, security, user, passwordEnc, fromName, fromEmail, enabled }
 * passwordEnc is the AES-256-GCM blob from lib/secrets.js — the plaintext password never touches the DB.
 */
const loadStoredSmtp = (query) => readSetting(query, SMTP_SETTINGS_KEY);

// Turns a stored row into a usable config (password decrypted). decryptFailed=true means the key rotated.
const storedToConfig = (stored) => {
  const v = (stored && stored.value) || {};
  const dec = v.passwordEnc ? tryDecrypt(v.passwordEnc) : { ok: true, value: '' };
  return {
    config: {
      host: v.host || '',
      port: Number(v.port) || 587,
      security: SECURITY_MODES.includes(v.security) ? v.security : 'starttls',
      user: v.user || '',
      password: dec.ok ? dec.value : '',
      fromName: v.fromName || '',
      fromEmail: v.fromEmail || '',
      enabled: Boolean(v.enabled),
      source: 'db'
    },
    decryptFailed: !dec.ok
  };
};

// Optional bootstrap for fresh instances: SMTP_HOST / SMTP_PORT / SMTP_SECURITY / SMTP_USER / SMTP_PASS / SMTP_FROM_*
const envConfig = () => {
  if (!process.env.SMTP_HOST) return null;
  const security = (process.env.SMTP_SECURITY || '').toLowerCase();
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    security: SECURITY_MODES.includes(security) ? security : (Number(process.env.SMTP_PORT) === 465 ? 'ssl' : 'starttls'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
    fromName: process.env.SMTP_FROM_NAME || 'Edu Portal',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || '',
    enabled: true,
    source: 'env'
  };
};

/**
 * resolveSmtpConfig(query) -> config | null
 *   1. app_settings['smtp'] when enabled           (set in Admin → Settings → Email)
 *   2. else SMTP_* env vars, if present            (optional bootstrap for fresh instances)
 *   3. else null -> demo mode
 */
async function resolveSmtpConfig(query) {
  const stored = await loadStoredSmtp(query);
  if (stored) {
    const { config, decryptFailed } = storedToConfig(stored);
    if (config.enabled && config.host && !decryptFailed) return config;
    // A saved-but-disabled config is an explicit choice for demo mode; do not fall through to env vars.
    if (stored.value && stored.value.enabled === false) return null;
  }
  return envConfig();
}

// Fingerprint of the delivery-relevant fields (incl. password) so a test result only counts for the exact config tested.
const configFingerprint = (cfg) => crypto
  .createHash('sha256')
  .update(JSON.stringify([cfg.host, Number(cfg.port), cfg.security, cfg.user, cfg.password, cfg.fromEmail]))
  .digest('hex');

// ------------------------------------------
// Transport
// ------------------------------------------

/*
 * Memoised nodemailer transport keyed by the config fingerprint: a saved change produces a new key,
 * so the cache naturally resets; resetTransportCache() also drops pooled sockets explicitly.
 */
const transportCache = new Map();

const transportOptions = (cfg) => {
  const base = {
    host: cfg.host,
    port: Number(cfg.port) || (cfg.security === 'ssl' ? 465 : 587),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    ...(cfg.user ? { auth: { user: cfg.user, pass: cfg.password || '' } } : {})
  };
  // security: 'starttls' -> secure:false + requireTLS (upgrade on 587)
  //           'ssl'      -> implicit TLS (465)
  //           'none'     -> plain (local relay only; the UI warns)
  if (cfg.security === 'ssl') return { ...base, secure: true };
  if (cfg.security === 'none') return { ...base, secure: false, ignoreTLS: true };
  return { ...base, secure: false, requireTLS: true };
};

function buildTransport(cfg) {
  const key = configFingerprint(cfg);
  if (!transportCache.has(key)) transportCache.set(key, nodemailer.createTransport(transportOptions(cfg)));
  return transportCache.get(key);
}

function resetTransportCache() {
  transportCache.forEach(t => { try { t.close(); } catch (err) { /* ignore */ } });
  transportCache.clear();
}

const fromHeader = (cfg) => {
  const email = cfg.fromEmail || cfg.user;
  return cfg.fromName ? `"${cfg.fromName.replace(/"/g, '')}" <${email}>` : email;
};

/**
 * sendMail(query, {to, subject, html, text, link}) -> {delivered, mode, previewLink?, error?}
 * Demo mode, or a send failure: log the link and return {delivered:false, previewLink: link},
 * so invites never dead-end. Callers decide whether previewLink may be shown (super-admin responses only).
 */
async function sendMail(query, { to, subject, html, text, link }) {
  let cfg = null;
  try {
    cfg = await resolveSmtpConfig(query);
  } catch (err) {
    cfg = null;
  }

  if (!cfg) {
    console.log(`✉️  [demo mode] Email to ${to} — "${subject}"${link ? `\n    Link: ${link}` : ''}`);
    return { delivered: false, mode: 'demo', ...(link ? { previewLink: link } : {}) };
  }

  try {
    await buildTransport(cfg).sendMail({ from: fromHeader(cfg), to, subject, text, html });
    return { delivered: true, mode: 'smtp' };
  } catch (err) {
    console.error(`✉️  SMTP send to ${to} failed (${cfg.host}): ${err.message}${link ? `\n    Fallback link: ${link}` : ''}`);
    return { delivered: false, mode: 'smtp', error: err.message, ...(link ? { previewLink: link } : {}) };
  }
}

/**
 * testSmtpConfig(cfg, to) -> {ok, error?}
 * Uses a throwaway (non-memoised) transport so unsaved form values never pollute the cache:
 * verify() checks connect + auth, then a short test message proves end-to-end delivery.
 */
async function testSmtpConfig(cfg, to) {
  const transport = nodemailer.createTransport(transportOptions(cfg));
  try {
    await transport.verify();
    await transport.sendMail({
      from: fromHeader(cfg),
      to,
      subject: 'Edu Portal test email',
      text: 'Your Gemini Enterprise - Edu Portal email settings work.',
      html: '<p>Your <strong>Gemini Enterprise - Edu Portal</strong> email settings work.</p>'
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  } finally {
    try { transport.close(); } catch (err) { /* ignore */ }
  }
}

module.exports = {
  SMTP_SETTINGS_KEY,
  SMTP_TEST_KEY,
  SECURITY_MODES,
  readSetting,
  writeSetting,
  loadStoredSmtp,
  storedToConfig,
  envConfig,
  resolveSmtpConfig,
  configFingerprint,
  buildTransport,
  resetTransportCache,
  sendMail,
  testSmtpConfig,
  encryptPassword: encrypt
};
