import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const priorities = ['low', 'medium', 'high'];

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errors = payload.errors?.length ? ` ${payload.errors.join(' ')}` : '';
    throw new Error(`${payload.message || 'Request failed.'}${errors}`);
  }

  return payload;
}

function formatDate(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function App() {
  const [todos, setTodos] = React.useState([]);
  const [meta, setMeta] = React.useState({ total: 0, page: 1, limit: 8, totalPages: 1 });
  const [filters, setFilters] = React.useState({
    search: '',
    completed: 'all',
    priority: 'all',
    sortBy: 'createdAt',
    order: 'desc',
    page: 1,
  });
  const [form, setForm] = React.useState(emptyForm);
  const [editingId, setEditingId] = React.useState(null);
  const [status, setStatus] = React.useState({ loading: true, saving: false, error: '' });

  const loadTodos = React.useCallback(async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }));

    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(meta.limit),
      sortBy: filters.sortBy,
      order: filters.order,
    });

    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.completed !== 'all') params.set('completed', filters.completed);
    if (filters.priority !== 'all') params.set('priority', filters.priority);

    try {
      const payload = await request(`/todos?${params.toString()}`);
      setTodos(payload.data || []);
      setMeta({
        total: payload.total || 0,
        page: payload.page || 1,
        limit: payload.limit || 8,
        totalPages: payload.totalPages || 1,
      });
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    } finally {
      setStatus((current) => ({ ...current, loading: false }));
    }
  }, [filters, meta.limit]);

  React.useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus((current) => ({ ...current, saving: true, error: '' }));

    const body = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };

    try {
      if (editingId) {
        await request(`/todos/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await request('/todos', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await loadTodos();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    } finally {
      setStatus((current) => ({ ...current, saving: false }));
    }
  }

  async function toggleTodo(id) {
    try {
      await request(`/todos/${id}/toggle`, { method: 'PATCH' });
      await loadTodos();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  }

  async function deleteTodo(id) {
    try {
      await request(`/todos/${id}`, { method: 'DELETE' });
      await loadTodos();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  }

  async function clearCompleted() {
    try {
      await request('/todos/completed/clear', { method: 'DELETE' });
      await loadTodos();
    } catch (error) {
      setStatus((current) => ({ ...current, error: error.message }));
    }
  }

  function editTodo(todo) {
    setEditingId(todo.id);
    setForm({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      dueDate: todo.dueDate ? todo.dueDate.slice(0, 10) : '',
    });
  }

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Todo API client</p>
            <h1>Todo Workspace</h1>
          </div>
          <button className="icon-button" type="button" onClick={loadTodos} title="Refresh todos">
            <RefreshCcw size={18} />
          </button>
        </header>

        <section className="summary-grid" aria-label="Todo summary">
          <div>
            <span>Total</span>
            <strong>{meta.total}</strong>
          </div>
          <div>
            <span>Visible done</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Page</span>
            <strong>{meta.page}/{meta.totalPages}</strong>
          </div>
        </section>

        {status.error ? (
          <div className="notice" role="alert">
            <AlertCircle size={18} />
            <span>{status.error}</span>
          </div>
        ) : null}

        <section className="content-grid">
          <form className="todo-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>{editingId ? 'Edit task' : 'New task'}</h2>
              {editingId ? (
                <button className="icon-button quiet" type="button" onClick={resetForm} title="Cancel edit">
                  <X size={18} />
                </button>
              ) : null}
            </div>

            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={200}
                required
                placeholder="Plan release notes"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows="4"
                placeholder="Add useful context"
              />
            </label>

            <div className="split-fields">
              <label>
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </label>
            </div>

            <button className="primary-button" type="submit" disabled={status.saving}>
              {status.saving ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
              <span>{editingId ? 'Save task' : 'Add task'}</span>
            </button>
          </form>

          <section className="tasks-panel">
            <div className="filters">
              <label className="search-field">
                <Search size={17} />
                <input
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Search tasks"
                />
              </label>

              <select value={filters.completed} onChange={(event) => updateFilter('completed', event.target.value)}>
                <option value="all">All status</option>
                <option value="false">Open</option>
                <option value="true">Completed</option>
              </select>

              <select value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}>
                <option value="all">All priorities</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>

              <select value={filters.sortBy} onChange={(event) => updateFilter('sortBy', event.target.value)}>
                <option value="createdAt">Created</option>
                <option value="updatedAt">Updated</option>
                <option value="title">Title</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due date</option>
              </select>

              <select value={filters.order} onChange={(event) => updateFilter('order', event.target.value)}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>

            <div className="task-actions">
              <button className="secondary-button" type="button" onClick={clearCompleted}>
                <Trash2 size={17} />
                <span>Clear completed</span>
              </button>
            </div>

            <div className="task-list" aria-live="polite">
              {status.loading ? (
                <div className="empty-state">
                  <Loader2 className="spin" size={24} />
                  <span>Loading tasks</span>
                </div>
              ) : todos.length ? (
                todos.map((todo) => (
                  <article className={`task-card ${todo.completed ? 'is-complete' : ''}`} key={todo.id}>
                    <button
                      className="check-button"
                      type="button"
                      onClick={() => toggleTodo(todo.id)}
                      title={todo.completed ? 'Mark open' : 'Mark complete'}
                    >
                      {todo.completed ? <Check size={18} /> : null}
                    </button>

                    <div className="task-body">
                      <div className="task-title-row">
                        <h3>{todo.title}</h3>
                        <span className={`priority priority-${todo.priority}`}>{todo.priority}</span>
                      </div>
                      {todo.description ? <p>{todo.description}</p> : null}
                      <div className="task-meta">
                        <CalendarDays size={15} />
                        <span>{formatDate(todo.dueDate)}</span>
                      </div>
                    </div>

                    <div className="task-buttons">
                      <button className="icon-button quiet" type="button" onClick={() => editTodo(todo)} title="Edit task">
                        <Edit3 size={17} />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        title="Delete task"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <span>No tasks match this view</span>
                </div>
              )}
            </div>

            <footer className="pagination">
              <button
                className="icon-button quiet"
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                title="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              <span>{meta.page} of {meta.totalPages}</span>
              <button
                className="icon-button quiet"
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                title="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </footer>
          </section>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
