# Todo Backend API

A full-featured Todo REST API built with Node.js, Express, and MySQL. Includes validation, centralized error handling, filtering/search/sort/pagination, persistent SQL storage, security middleware, and an automated test suite.

## Features

- Full CRUD for todos (create, read, update, delete) plus a quick-toggle and bulk "clear completed" endpoint
- Filtering by completion status and priority, free-text search, sorting, and pagination
- Input validation with clear 400 error responses
- Centralized error handling with consistent JSON error shape
- Persistence with MySQL using the `mysql2` driver
- Security middleware: `helmet`, `cors`, and rate limiting on `/api` routes
- Request logging via `morgan` (dev format in development, combined in production)
- Jest + Supertest test suite (15 passing tests covering the whole API)

## Project structure

```
todo-backend/
├── server.js                    # Entry point — boots the HTTP server
├── src/
│   ├── app.js                   # Express app: middleware + route wiring
│   ├── routes/todoRoutes.js     # URL → controller mapping
│   ├── controllers/             # Request/response handling
│   │   └── todoController.js
│   ├── models/                  # Data access + business logic
│   │   └── todoModel.js
│   ├── middleware/
│   │   ├── validateTodo.js      # Input validation
│   │   ├── notFound.js          # 404 handler
│   │   └── errorHandler.js      # Centralized error handler
│   ├── config/
│   │   └── db.js                # MySQL connection pool
│   └── utils/
│       ├── ApiError.js          # Custom error class (statusCode + message)
│       ├── asyncHandler.js      # Wraps async route handlers
│       └── fileDB.js            # Legacy JSON-file storage helper
├── tests/
│   └── todo.test.js             # Jest + Supertest integration tests
├── .env.example
└── package.json
```

## Getting started

Requires Node.js 14.17+ (uses `crypto.randomUUID()`). Tested on Node 22.

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env

# 3. Update the MySQL values in .env, then run in development
npm run dev

# Or run in production mode
npm start
```

The server starts on `http://localhost:5000` by default (configurable via `.env`). On first API use, the app creates the configured database when `DB_AUTO_CREATE=true` and creates the `todos` table if it does not exist.

### Environment variables (`.env`)

| Variable              | Default       | Description                                           |
|-----------------------|---------------|-------------------------------------------------------|
| `PORT`                | `5000`        | Port the server listens on                            |
| `NODE_ENV`            | `development` | `development`, `production`, or `test`                |
| `DB_URI`              | none          | MySQL URI, e.g. `mysql://root:password@localhost:3306/todo_app` |
| `DATABASE_URL`        | none          | Optional fallback if `DB_URI` is not set              |
| `DB_AUTO_CREATE`      | `true`        | Create the database automatically when permitted      |
| `DB_CONNECTION_LIMIT` | `10`          | MySQL connection pool size                            |

If your password contains special characters, URL-encode it in `DB_URI`. For example, `p@ss word` becomes `p%40ss%20word`.

If your MySQL user cannot create databases, create it manually and set `DB_AUTO_CREATE=false`:

```sql
CREATE DATABASE todo_app;
```

The app creates this table automatically:

```sql
CREATE TABLE IF NOT EXISTS todos (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  dueDate DATE NULL,
  createdAt DATETIME(3) NOT NULL,
  updatedAt DATETIME(3) NOT NULL
);
```

### Running tests

```bash
npm test
```

Runs the full Jest + Supertest suite.

## API reference

Base URL: `http://localhost:5000/api/todos`

| Method | Endpoint                  | Description                                  |
|--------|----------------------------|-----------------------------------------------|
| GET    | `/api/todos`               | List todos (supports query params below)     |
| GET    | `/api/todos/:id`            | Get a single todo                             |
| POST   | `/api/todos`                | Create a todo                                 |
| PUT    | `/api/todos/:id`            | Replace/update a todo's fields                |
| PATCH  | `/api/todos/:id`            | Partially update a todo                       |
| PATCH  | `/api/todos/:id/toggle`     | Flip a todo's `completed` state                |
| DELETE | `/api/todos/:id`            | Delete a todo                                  |
| DELETE | `/api/todos/completed/clear`| Delete all completed todos at once             |
| GET    | `/health`                   | Health check                                   |

### Query parameters for `GET /api/todos`

| Param       | Example              | Effect                                              |
|-------------|------------------------|------------------------------------------------------|
| `completed` | `?completed=true`      | Filter by completion status (`true`/`false`)        |
| `priority`  | `?priority=high`       | Filter by `low`, `medium`, or `high`                 |
| `search`    | `?search=milk`         | Case-insensitive match on title and description       |
| `sortBy`    | `?sortBy=dueDate`      | `createdAt` (default), `updatedAt`, `title`, `priority`, `dueDate` |
| `order`     | `?order=asc`           | `asc` or `desc` (default)                            |
| `page`      | `?page=2`              | Page number (default `1`)                            |
| `limit`     | `?limit=20`            | Items per page, max `100` (default `10`)              |

### Todo object shape

```json
{
  "id": "3c53555b-08f4-4aed-ac1d-a00e66cbe070",
  "title": "Buy groceries",
  "description": "",
  "completed": false,
  "priority": "high",
  "dueDate": "2026-06-25",
  "createdAt": "2026-06-18T05:45:52.134Z",
  "updatedAt": "2026-06-18T05:45:52.134Z"
}
```

`priority` is one of `low`, `medium`, `high` (defaults to `medium`). `dueDate` and `description` are optional.

### Example requests

Create a todo:
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","priority":"high","dueDate":"2026-06-25"}'
```

List incomplete, high-priority todos sorted by due date:
```bash
curl "http://localhost:5000/api/todos?completed=false&priority=high&sortBy=dueDate&order=asc"
```

Toggle completion:
```bash
curl -X PATCH http://localhost:5000/api/todos/<id>/toggle
```

Partially update (e.g. change just the title):
```bash
curl -X PATCH http://localhost:5000/api/todos/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries and milk"}'
```

Delete a todo:
```bash
curl -X DELETE http://localhost:5000/api/todos/<id>
```

Clear all completed todos:
```bash
curl -X DELETE http://localhost:5000/api/todos/completed/clear
```

### Response format

Success:
```json
{ "success": true, "data": { ... } }
```

List endpoints additionally include pagination metadata:
```json
{ "success": true, "count": 10, "total": 42, "page": 1, "limit": 10, "totalPages": 5, "data": [ ... ] }
```

Error:
```json
{ "success": false, "message": "Validation failed", "errors": ["title is required and must be a non-empty string"] }
```

## Notes on extending this project

- **Swap storage for another database:** `src/models/todoModel.js` is the main place that talks to storage. Replace the MySQL queries with a Mongoose model, Prisma client, or another driver, and the controllers/routes should need minimal changes.
- **Authentication:** none is included. To scope todos per-user, add an `auth` middleware that attaches `req.user`, then filter/stamp todos by `userId` in the model layer.
- **CORS:** currently allows all origins (`cors()` with no options) for ease of local development. Restrict this with an `origin` allowlist before deploying publicly.
