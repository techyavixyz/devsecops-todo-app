/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isInternalError = statusCode >= 500;

  if (isInternalError) {
    console.error(`[error] ${req.method} ${req.originalUrl}: ${err.message}`);
    if (process.env.NODE_ENV === 'development' && err.stack) {
      console.error(err.stack);
    }
  }

  const response = {
    success: false,
    message: isInternalError ? 'Service temporarily unavailable' : err.message || 'Request failed',
  };
  if (!isInternalError && err.errors && err.errors.length) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
