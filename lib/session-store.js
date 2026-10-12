/* lib/session-store.js - express-session store persisted in the app database (PostgreSQL / SQLite) */

/**
 * Why: the default MemoryStore lives inside one Node process. On Cloud Run every
 * scale-to-zero, new revision or extra instance starts with an empty store, so a
 * user whose tab is still open suddenly has no session: authenticated writes such
 * as POST /api/use-cases/like return 401 while the UI still looks signed in.
 * Persisting sessions in the shared database makes them survive instance changes.
 *
 * Table: sessions(sid PK, sess TEXT JSON, expires BIGINT epoch-ms).
 * Expired rows are ignored on read and pruned lazily (at most once per PRUNE_MS).
 *
 * Built as a plain object on top of `new session.Store()` (no class hierarchy):
 * express-session only needs get / set / destroy (+ optional touch).
 */
const PRUNE_MS = 15 * 60 * 1000;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function createDbSessionStore(session, { query, dbType }) {
  const expiresType = dbType === 'postgres' ? 'BIGINT' : 'INTEGER';
  const sidType = dbType === 'postgres' ? 'VARCHAR(255)' : 'TEXT';

  // Memoised so the CREATE runs once, even if requests arrive before initializeSchemas()
  let ready = null;
  const ensureTable = () => {
    if (!ready) {
      ready = query(`CREATE TABLE IF NOT EXISTS sessions (
        sid ${sidType} PRIMARY KEY,
        sess TEXT NOT NULL,
        expires ${expiresType} NOT NULL
      )`).catch(err => { ready = null; throw err; });
    }
    return ready;
  };

  const expiryOf = (sess) => {
    const cookieExpiry = sess && sess.cookie && sess.cookie.expires ? new Date(sess.cookie.expires).getTime() : NaN;
    return Number.isFinite(cookieExpiry) ? cookieExpiry : Date.now() + DEFAULT_TTL_MS;
  };

  let lastPrune = 0;
  const maybePrune = () => {
    const now = Date.now();
    if (now - lastPrune < PRUNE_MS) return;
    lastPrune = now;
    query('DELETE FROM sessions WHERE expires < ?', [now]).catch(() => {});
  };

  const upsert = async (sid, sess) => {
    await ensureTable();
    await query(
      `INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?)
       ON CONFLICT (sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires`,
      [sid, JSON.stringify(sess), expiryOf(sess)]
    );
    maybePrune();
  };

  const store = new session.Store();

  store.get = (sid, cb) => {
    ensureTable()
      .then(() => query('SELECT sess, expires FROM sessions WHERE sid = ?', [sid]))
      .then(rows => {
        const row = rows && rows[0];
        if (!row || Number(row.expires) < Date.now()) return cb(null, null);
        cb(null, JSON.parse(row.sess));
      })
      .catch(err => cb(err));
  };

  store.set = (sid, sess, cb = () => {}) => {
    upsert(sid, sess).then(() => cb(null), cb);
  };

  // Rolling expiry refresh; rewriting the row keeps the code path identical to set()
  store.touch = (sid, sess, cb = () => {}) => {
    upsert(sid, sess).then(() => cb(null), cb);
  };

  store.destroy = (sid, cb = () => {}) => {
    ensureTable()
      .then(() => query('DELETE FROM sessions WHERE sid = ?', [sid]))
      .then(() => cb(null), cb);
  };

  return store;
}

module.exports = { createDbSessionStore };
