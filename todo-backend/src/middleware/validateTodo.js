const ApiError = require('../utils/ApiError');
const { VALID_PRIORITIES } = require('../models/todoModel');

function validateCreate(req, res, next) {
  const errors = [];
  const { title, priority, dueDate, completed } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('title is required and must be a non-empty string');
  } else if (title.trim().length > 200) {
    errors.push('title must be 200 characters or fewer');
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
    errors.push('dueDate must be a valid date string (e.g. 2026-01-31)');
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push('completed must be a boolean');
  }

  if (errors.length) {
    return next(new ApiError(400, 'Validation failed', errors));
  }
  next();
}

function validateUpdate(req, res, next) {
  const errors = [];
  const body = req.body || {};
  const { title, completed, priority, dueDate } = body;

  if (Object.keys(body).length === 0) {
    errors.push('Request body cannot be empty');
  }
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    errors.push('title must be a non-empty string');
  }
  if (title !== undefined && title.trim().length > 200) {
    errors.push('title must be 200 characters or fewer');
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.push('completed must be a boolean');
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
    errors.push('dueDate must be a valid date string (e.g. 2026-01-31)');
  }

  if (errors.length) {
    return next(new ApiError(400, 'Validation failed', errors));
  }
  next();
}

module.exports = { validateCreate, validateUpdate };
