# Todo Frontend

React frontend for the Express Todo API.

## Setup

```bash
cd ../todo-frontend
npm install
cp .env.example .env
npm run dev
```

By default, the app connects to:

```text
http://localhost:5000/api
```

Change `VITE_API_BASE_URL` in `.env` if the backend runs somewhere else.

## Backend

Start the backend from the `todo-backend` directory:

```bash
npm run dev
```

Then open the frontend URL printed by Vite.
