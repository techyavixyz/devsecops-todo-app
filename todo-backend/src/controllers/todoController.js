const todoModel = require('../models/todoModel');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const parsePositiveInt = (value, fallback, max) => {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return max ? Math.min(parsed, max) : parsed;
};

// GET /api/todos
const getTodos = asyncHandler(async (req, res) => {
  const { completed, priority, search, sortBy, order } = req.query;

  const filters = {
    sortBy,
    order,
    page: parsePositiveInt(req.query.page, 1),
    limit: parsePositiveInt(req.query.limit, 10, 100),
  };
  if (completed !== undefined) filters.completed = completed === 'true';
  if (priority) filters.priority = priority;
  if (search) filters.search = search;

  const { data, meta } = await todoModel.getAll(filters);

  res.status(200).json({
    success: true,
    count: data.length,
    ...meta,
    data,
  });
});

// GET /api/todos/:id
const getTodo = asyncHandler(async (req, res) => {
  const todo = await todoModel.getById(req.params.id);
  if (!todo) {
    throw new ApiError(404, `Todo not found with id ${req.params.id}`);
  }
  res.status(200).json({ success: true, data: todo });
});

// POST /api/todos
const createTodo = asyncHandler(async (req, res) => {
  const todo = await todoModel.create(req.body);
  res.status(201).json({ success: true, message: 'Todo created', data: todo });
});

// PUT/PATCH /api/todos/:id
const updateTodo = asyncHandler(async (req, res) => {
  const todo = await todoModel.update(req.params.id, req.body);
  if (!todo) {
    throw new ApiError(404, `Todo not found with id ${req.params.id}`);
  }
  res.status(200).json({ success: true, message: 'Todo updated', data: todo });
});

// PATCH /api/todos/:id/toggle
const toggleTodo = asyncHandler(async (req, res) => {
  const existing = await todoModel.getById(req.params.id);
  if (!existing) {
    throw new ApiError(404, `Todo not found with id ${req.params.id}`);
  }
  const todo = await todoModel.update(req.params.id, { completed: !existing.completed });
  res.status(200).json({ success: true, message: 'Todo toggled', data: todo });
});

// DELETE /api/todos/:id
const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await todoModel.remove(req.params.id);
  if (!todo) {
    throw new ApiError(404, `Todo not found with id ${req.params.id}`);
  }
  res.status(200).json({ success: true, message: 'Todo deleted', data: todo });
});

// DELETE /api/todos/completed/clear
const clearCompletedTodos = asyncHandler(async (req, res) => {
  const removedCount = await todoModel.clearCompleted();
  res.status(200).json({ success: true, message: `${removedCount} completed todo(s) cleared` });
});

module.exports = {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompletedTodos,
};
