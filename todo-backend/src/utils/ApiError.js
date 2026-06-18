/**
 * Custom error class carrying an HTTP status code and optional field-level
 * error details, so the centralized error handler can format consistent
 * JSON responses.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
