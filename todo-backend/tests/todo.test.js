process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
const todoModel = require('../src/models/todoModel');
const { closePool } = require('../src/config/db');

describe('Todo API', () => {
  beforeEach(async () => {
    await todoModel.resetForTests();
  });

  afterAll(async () => {
    await closePool();
  });

  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/todos returns an empty list initially', async () => {
    const res = await request(app).get('/api/todos');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('POST /api/todos creates a new todo', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({ title: 'Buy milk', priority: 'high' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Buy milk');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.completed).toBe(false);
    expect(res.body.data.id).toBeDefined();
  });

  test('POST /api/todos fails validation without a title', async () => {
    const res = await request(app).post('/api/todos').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /api/todos fails validation with a bad priority', async () => {
    const res = await request(app).post('/api/todos').send({ title: 'X', priority: 'urgent' });
    expect(res.statusCode).toBe(400);
  });

  test('GET /api/todos/:id returns a single todo', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Walk dog' });
    const id = created.body.data.id;

    const res = await request(app).get(`/api/todos/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Walk dog');
  });

  test('GET /api/todos/:id returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/todos/does-not-exist');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/todos/:id updates a todo', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Old title' });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/todos/${id}`)
      .send({ title: 'New title', completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('New title');
    expect(res.body.data.completed).toBe(true);
  });

  test('PATCH /api/todos/:id/toggle flips completed state', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Task' });
    const id = created.body.data.id;

    const first = await request(app).patch(`/api/todos/${id}/toggle`);
    expect(first.body.data.completed).toBe(true);

    const second = await request(app).patch(`/api/todos/${id}/toggle`);
    expect(second.body.data.completed).toBe(false);
  });

  test('DELETE /api/todos/:id removes a todo', async () => {
    const created = await request(app).post('/api/todos').send({ title: 'Delete me' });
    const id = created.body.data.id;

    const del = await request(app).delete(`/api/todos/${id}`);
    expect(del.statusCode).toBe(200);

    const getAfter = await request(app).get(`/api/todos/${id}`);
    expect(getAfter.statusCode).toBe(404);
  });

  test('GET /api/todos?completed=true filters correctly', async () => {
    await request(app).post('/api/todos').send({ title: 'A', completed: true });
    await request(app).post('/api/todos').send({ title: 'B', completed: false });

    const res = await request(app).get('/api/todos?completed=true');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('A');
  });

  test('GET /api/todos?search= matches title and description', async () => {
    await request(app).post('/api/todos').send({ title: 'Buy groceries' });
    await request(app).post('/api/todos').send({ title: 'Clean house' });

    const res = await request(app).get('/api/todos?search=groceries');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Buy groceries');
  });

  test('GET /api/todos supports pagination', async () => {
    for (let i = 1; i <= 15; i += 1) {
      await request(app).post('/api/todos').send({ title: `Task ${i}` });
    }
    const res = await request(app).get('/api/todos?page=2&limit=10');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBe(5);
    expect(res.body.page).toBe(2);
    expect(res.body.totalPages).toBe(2);
  });

  test('DELETE /api/todos/completed/clear removes only completed todos', async () => {
    await request(app).post('/api/todos').send({ title: 'Done', completed: true });
    await request(app).post('/api/todos').send({ title: 'Not done', completed: false });

    const res = await request(app).delete('/api/todos/completed/clear');
    expect(res.statusCode).toBe(200);

    const list = await request(app).get('/api/todos');
    expect(list.body.data.length).toBe(1);
    expect(list.body.data[0].title).toBe('Not done');
  });

  test('Unknown route returns a 404 JSON response', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
