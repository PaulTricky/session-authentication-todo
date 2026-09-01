import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import 'dotenv/config';
import Database from 'better-sqlite3';

const dir = path.dirname(fileURLToPath(import.meta.url));

export const dbFile = path.resolve(dir, '..', process.env.DATABASE_FILE || 'data/app.db');

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new Database(dbFile);

// WAL lets reads run while a write is in flight, which is what we want for a
// local dev server. NORMAL is the matching durability level for WAL.
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// The schema is applied here, at connection time, rather than from an exported
// init function. Models call db.prepare() at import time, and every import in a
// module graph evaluates before the importing module's own statements run, so
// any later init() would fire after the models had already tried to prepare
// against tables that did not exist yet. schema.sql is idempotent, so running
// it on every open is cheap and safe.
db.exec(fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8'));

console.log('sqlite connected at ' + dbFile);

export default db;
