import crypto from 'crypto';

import db from '../db/db.js';
import Message from './Message.js';

const insert = db.prepare(`
  INSERT INTO projects (id, user_id, name, description, files)
  VALUES (@id, @userId, @name, @description, @files)
  RETURNING *
`);

const selectById = db.prepare('SELECT * FROM projects WHERE id = ?');

const selectPublishedById = db.prepare(
  'SELECT * FROM projects WHERE id = ? AND published = 1'
);

// The list view only needs summaries, so it skips the (large) files column.
const selectSummariesByUser = db.prepare(`
  SELECT id, name, description, version, status, published, created_at, updated_at
  FROM projects WHERE user_id = ? ORDER BY updated_at DESC
`);

const updateFiles = db.prepare('UPDATE projects SET files = ? WHERE id = ?');
const updatePublished = db.prepare('UPDATE projects SET published = ? WHERE id = ?');
const bumpVersion = db.prepare(
  "UPDATE projects SET version = version + 1, status = 'completed' WHERE id = ?"
);
const deleteById = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?');

// files is stored as a JSON string; published as 0/1. Both are unpacked here so
// routes never have to think about it. Summary rows have no files column.
export const toProject = (row, messages) =>
  row && {
    _id: row.id,
    name: row.name,
    description: row.description,
    version: row.version,
    status: row.status,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.files !== undefined && { files: JSON.parse(row.files) }),
    ...(messages && { messages }),
  };

// A project and its opening messages must land together or not at all.
const createWithMessages = db.transaction(
  ({ userId, name, description, files, messages }) => {
    const row = insert.get({
      id: crypto.randomUUID(),
      userId,
      name,
      description,
      files: JSON.stringify(files ?? {}),
    });

    for (const m of messages ?? []) {
      Message.create({ projectId: row.id, role: m.role, content: m.content });
    }

    return row;
  }
);

// Same for a chat turn: the user prompt, the reply, and the version bump.
const appendTurn = db.transaction((projectId, messages) => {
  for (const m of messages) {
    Message.create({ projectId, role: m.role, content: m.content });
  }

  bumpVersion.run(projectId);

  return selectById.get(projectId);
});

export const Project = {
  create(input) {
    const row = createWithMessages(input);

    return toProject(row, Message.listByProject(row.id));
  },

  listByUser(userId) {
    return selectSummariesByUser.all(userId).map((row) => toProject(row));
  },

  findById(id) {
    const row = selectById.get(id);

    return row ? toProject(row, Message.listByProject(id)) : null;
  },

  findPublishedById(id) {
    const row = selectPublishedById.get(id);

    return row ? toProject(row, Message.listByProject(id)) : null;
  },

  addChatTurn(id, messages) {
    const row = appendTurn(id, messages);

    return row ? toProject(row, Message.listByProject(id)) : null;
  },

  saveFiles(id, files) {
    return updateFiles.run(JSON.stringify(files), id).changes > 0;
  },

  setPublished(id, published) {
    return updatePublished.run(published ? 1 : 0, id).changes > 0;
  },

  remove(id, userId) {
    return deleteById.run(id, userId).changes > 0;
  },
};

export default Project;
