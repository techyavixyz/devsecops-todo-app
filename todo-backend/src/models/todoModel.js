const crypto = require('crypto');
const { query } = require('../config/db');

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const SORTABLE_FIELDS = ['createdAt', 'updatedAt', 'title', 'priority', 'dueDate'];

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS todos (
      id CHAR(36) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      dueDate DATE NULL,
      createdAt DATETIME(3) NOT NULL,
      updatedAt DATETIME(3) NOT NULL,
      INDEX idx_todos_completed (completed),
      INDEX idx_todos_priority (priority),
      INDEX idx_todos_createdAt (createdAt),
      INDEX idx_todos_dueDate (dueDate)
    )
  `);

  tableReady = true;
}

function toMySqlDateTime(date = new Date()) {
  return date.toISOString().slice(0, 23).replace('T', ' ');
}

function normalizeTodo(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    completed: Boolean(row.completed),
    priority: row.priority,
    dueDate: row.dueDate || null,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

function buildFilters({ completed, priority, search } = {}) {
  const clauses = [];
  const params = [];

  if (completed !== undefined) {
    clauses.push('completed = ?');
    params.push(Boolean(completed));
  }

  if (priority) {
    clauses.push('priority = ?');
    params.push(priority);
  }

  if (search) {
    clauses.push('(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)');
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

async function getAll({
  completed,
  priority,
  search,
  sortBy = 'createdAt',
  order = 'desc',
  page = 1,
  limit = 10,
} = {}) {
  await ensureTable();

  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const direction = order === 'asc' ? 'ASC' : 'DESC';
  const currentLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const requestedPage = Math.max(Number(page) || 1, 1);
  const { where, params } = buildFilters({ completed, priority, search });

  const [countRow] = await query(`SELECT COUNT(*) AS total FROM todos ${where}`, params);
  const total = Number(countRow.total) || 0;
  const totalPages = Math.max(Math.ceil(total / currentLimit), 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * currentLimit;

  const rows = await query(
    `SELECT * FROM todos ${where} ORDER BY ${sortField} ${direction} LIMIT ${currentLimit} OFFSET ${offset}`,
    params
  );

  return {
    data: rows.map(normalizeTodo),
    meta: { total, page: currentPage, limit: currentLimit, totalPages },
  };
}

async function getById(id) {
  await ensureTable();

  const rows = await query('SELECT * FROM todos WHERE id = ? LIMIT 1', [id]);
  return normalizeTodo(rows[0]);
}

async function create({ title, description = '', completed = false, priority = 'medium', dueDate = null }) {
  await ensureTable();

  const now = toMySqlDateTime();
  const todo = {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description ? description.trim() : '',
    completed: Boolean(completed),
    priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
    dueDate: dueDate || null,
    createdAt: now,
    updatedAt: now,
  };

  await query(
    `INSERT INTO todos
      (id, title, description, completed, priority, dueDate, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      todo.id,
      todo.title,
      todo.description,
      todo.completed,
      todo.priority,
      todo.dueDate,
      todo.createdAt,
      todo.updatedAt,
    ]
  );

  return getById(todo.id);
}

async function update(id, updates) {
  await ensureTable();

  const existing = await getById(id);
  if (!existing) return null;

  const allowedFields = ['title', 'description', 'completed', 'priority', 'dueDate'];
  const assignments = [];
  const params = [];

  for (const field of allowedFields) {
    if (updates[field] === undefined) continue;

    let value = updates[field];
    if (field === 'title') value = value.trim();
    if (field === 'description') value = value ? value.trim() : '';
    if (field === 'completed') value = Boolean(value);
    if (field === 'dueDate') value = value || null;

    assignments.push(`${field} = ?`);
    params.push(value);
  }

  assignments.push('updatedAt = ?');
  params.push(toMySqlDateTime());
  params.push(id);

  await query(`UPDATE todos SET ${assignments.join(', ')} WHERE id = ?`, params);
  return getById(id);
}

async function remove(id) {
  await ensureTable();

  const existing = await getById(id);
  if (!existing) return null;

  await query('DELETE FROM todos WHERE id = ?', [id]);
  return existing;
}

async function clearCompleted() {
  await ensureTable();

  const result = await query('DELETE FROM todos WHERE completed = TRUE');
  return result.affectedRows || 0;
}

async function resetForTests() {
  await ensureTable();
  await query('DELETE FROM todos');
}

module.exports = {
  initialize: ensureTable,
  getAll,
  getById,
  create,
  update,
  remove,
  clearCompleted,
  resetForTests,
  VALID_PRIORITIES,
};
