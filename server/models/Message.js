import db from '../db/db.js';

const insert = db.prepare(`
  INSERT INTO messages (project_id, role, content)
  VALUES (@projectId, @role, @content)
  RETURNING *
`);

const selectByProject = db.prepare(
  'SELECT * FROM messages WHERE project_id = ? ORDER BY id'
);

export const toMessage = (row) => ({
  role: row.role,
  content: row.content,
  timestamp: row.created_at,
});

export const Message = {
  create({ projectId, role, content }) {
    return insert.get({ projectId, role, content });
  },

  listByProject(projectId) {
    return selectByProject.all(projectId).map(toMessage);
  },
};

export default Message;
