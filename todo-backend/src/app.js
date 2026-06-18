const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const todoRoutes = require('./routes/todoRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Security & utility middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// --- Rate limiting for the API (skipped in tests so the suite isn't throttled) ---
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);
}

// --- Health check ---
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use('/api/todos', todoRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Todo API',
    docs: '/api/todos',
  });
});

// --- 404 + centralized error handler (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
