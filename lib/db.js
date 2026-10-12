/* lib/db.js - Dual database connection layer (PostgreSQL / SQLite) shared by server.js and CLI scripts */

const path = require('path');

/**
 * Creates the database handle used by the app.
 * - DATABASE_URL set   -> PostgreSQL pool (Cloud Run / Cloud SQL)
 * - otherwise          -> local file-based SQLite (`edu_portal.db` in the repo root)
 *
 * Returns a plain object of functions so callers stay functional:
 *   { dbType, query(sql, params), withTransaction(fn), affectedRows(result), close() }
 */
function createDb({ log = console.log } = {}) {
  const pgConnectionString = process.env.DATABASE_URL;

  if (pgConnectionString) {
    const { Pool } = require('pg');
    const useSSL = process.env.NODE_ENV === 'production' && process.env.DISABLE_PG_SSL !== 'true';
    const pgPool = new Pool({
      connectionString: pgConnectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false
    });
    log('⚡ Using Cloud/Production PostgreSQL Connection Layer.');

    // Dynamically convert SQLite "?" placeholders to PostgreSQL "$1", "$2", etc.
    // NOTE: SQL text must never contain a literal "?" — all user values travel as params.
    const toPg = (sql) => {
      let index = 1;
      let convertedSql = sql;
      while (convertedSql.includes('?')) {
        convertedSql = convertedSql.replace('?', `$${index}`);
        index++;
      }
      return convertedSql;
    };

    const runOn = (executor) => (sql, params = []) => executor.query(toPg(sql), params).then(res => res.rows);
    const query = runOn(pgPool);

    // Runs fn(txQuery) on one dedicated pooled client between BEGIN / COMMIT (ROLLBACK on throw).
    const withTransaction = async (fn) => {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(runOn(client));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    };

    return {
      dbType: 'postgres',
      query,
      withTransaction,
      // pg mutations only report rows when the SQL uses RETURNING
      affectedRows: (result) => (Array.isArray(result) ? result.length : 0),
      close: () => pgPool.end()
    };
  }

  const sqlite3 = require('sqlite3').verbose();
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '..', 'edu_portal.db');
  const sqliteDb = new sqlite3.Database(dbPath);
  log(`⚡ Using Local File-Based SQLite Fallback DB: ${dbPath}`);

  // Database query wrapper function to unify Postgres pool and SQLite connections
  const query = (sql, params = []) => new Promise((resolve, reject) => {
    // Differentiate between mutation queries (run) and retrieval queries (all)
    const head = sql.trim().toUpperCase();
    const isMutation = ['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'CREATE'].some(k => head.startsWith(k));

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

  /*
   * SQLite has a single connection, so BEGIN/COMMIT apply to the whole handle.
   * A promise-chain mutex serialises transactional blocks against each other
   * (unrelated single statements may still interleave — acceptable for the local/demo fallback).
   */
  let txChain = Promise.resolve();
  const withTransaction = (fn) => {
    const run = async () => {
      await query('BEGIN');
      try {
        const result = await fn(query);
        await query('COMMIT');
        return result;
      } catch (err) {
        await query('ROLLBACK').catch(() => {});
        throw err;
      }
    };
    const next = txChain.then(run, run);
    txChain = next.catch(() => {});
    return next;
  };

  return {
    dbType: 'sqlite',
    query,
    withTransaction,
    affectedRows: (result) => (result && typeof result.changes === 'number' ? result.changes : 0),
    close: () => new Promise(resolve => sqliteDb.close(() => resolve()))
  };
}

module.exports = { createDb };
