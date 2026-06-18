require('dotenv').config();
const app = require('./src/app');
const todoModel = require('./src/models/todoModel');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Todo API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);

  todoModel.initialize().catch((err) => {
    console.error(`[database] MySQL connection failed: ${err.message}`);
    server.close(() => process.exit(1));
  });
});

// Guard against unhandled promise rejections crashing the process silently
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = server;
