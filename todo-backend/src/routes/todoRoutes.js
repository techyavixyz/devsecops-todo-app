const express = require('express');
const {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
  clearCompletedTodos,
} = require('../controllers/todoController');
const { validateCreate, validateUpdate } = require('../middleware/validateTodo');

const router = express.Router();

router.get('/', getTodos);
router.post('/', validateCreate, createTodo);

// Specific routes before /:id so they aren't shadowed
router.delete('/completed/clear', clearCompletedTodos);

router.get('/:id', getTodo);
router.put('/:id', validateUpdate, updateTodo);
router.patch('/:id', validateUpdate, updateTodo);
router.patch('/:id/toggle', toggleTodo);
router.delete('/:id', deleteTodo);

module.exports = router;
