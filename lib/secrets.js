/* lib/secrets.js - AES-256-GCM encryption for secrets stored at rest (e.g. the SMTP password in app_settings) */

const crypto = require('crypto');

const VERSION = 'v1';

/*
 * 32-byte key = sha256(SETTINGS_ENCRYPTION_KEY || SESSION_SECRET). Rotating it means re-entering stored secrets.
 * There is deliberately no hard-coded fallback (a key published in the repo would protect nothing): without
 * either env var, encrypt/decrypt throw an Error with code NO_ENCRYPTION_KEY that callers turn into a clear message.
 */
const deriveKey = () => {
  const material = process.env.SETTINGS_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!material) {
    const err = new Error('SETTINGS_ENCRYPTION_KEY is not set. Add it to .env (see .env.example) to store secret settings.');
    err.code = 'NO_ENCRYPTION_KEY';
    throw err;
  }
  return crypto.createHash('sha256').update(material).digest();
};

/**
 * encrypt(plain) -> "v1:<iv>:<tag>:<cipher>" (all base64).
 * A fresh random 12-byte IV per call means identical plaintexts never produce identical blobs;
 * the 16-byte GCM auth tag makes tampering (or a wrong key) fail loudly on decrypt.
 */
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

// decrypt(blob) -> plain string. Throws if the blob is malformed, tampered with, or the key changed.
function decrypt(blob) {
  const [version, ivB64, tagB64, dataB64] = String(blob || '').split(':');
  if (version !== VERSION || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error('Unsupported or malformed secret blob.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

// Non-throwing variant: returns { ok, value } so callers can surface "re-enter the password" in the UI.
const tryDecrypt = (blob) => {
  try {
    return { ok: true, value: decrypt(blob) };
  } catch (err) {
    return { ok: false, value: null };
  }
};

module.exports = { encrypt, decrypt, tryDecrypt };
