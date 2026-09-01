import crypto from 'crypto';

import bcrypt from 'bcrypt';

import db from '../db/db.js';

const SALT_ROUNDS = 10;

// Computed once, lazily, so an unknown-email login still pays a full bcrypt
// comparison without re-deriving a throwaway hash on every attempt.
let dummyHash;
const getDummyHash = async () =>
  (dummyHash ??= await bcrypt.hash('unused-placeholder', SALT_ROUNDS));

// Prepared once at import, reused on every call. This is where better-sqlite3
// gets its speed, and it is what keeps values parameterised (no SQL injection).
const insert = db.prepare(`
  INSERT INTO users (id, name, email, password)
  VALUES (@id, @name, @email, @password)
  RETURNING id, name, email, created_at, updated_at
`);

const selectByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const selectById = db.prepare('SELECT * FROM users WHERE id = ?');
const updateName = db.prepare('UPDATE users SET name = ? WHERE id = ?');
const updatePassword = db.prepare('UPDATE users SET password = ? WHERE id = ?');

// Strips the password hash and renames columns to the shape the client expects.
export const toUser = (row) =>
  row && {
    _id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

export const User = {
  // Stands in for mongoose's pre('save') hook: hashing lives here so no caller
  // can store a plaintext password by forgetting a step. Async because bcrypt
  // runs the KDF on libuv's thread pool; the sync variants would block the
  // event loop for ~100ms per call at these rounds.
  async create({ name, email, password }) {
    return insert.get({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      password: await bcrypt.hash(password, SALT_ROUNDS),
    });
  },

  // Returns the raw row, password hash included, so callers can verify against
  // it. Pass it through toUser() before it reaches a response body.
  findByEmail(email) {
    return selectByEmail.get(email.trim());
  },

  findById(id) {
    return selectById.get(id);
  },

  verifyPassword(row, password) {
    return bcrypt.compare(password, row.password);
  },

  // Looks up and checks in one step, and always runs a bcrypt comparison even
  // when the email is unknown. Returning early on a missing user would make
  // "no such account" measurably faster than "wrong password", which leaks
  // which emails are registered.
  async authenticate(email, password) {
    const row = selectByEmail.get(email.trim());
    const ok = await bcrypt.compare(password, row?.password ?? (await getDummyHash()));

    return ok && row ? row : null;
  },

  async setPassword(id, password) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    return updatePassword.run(hash, id).changes > 0;
  },

  rename(id, name) {
    return updateName.run(name.trim(), id).changes > 0;
  },
};

export default User;
