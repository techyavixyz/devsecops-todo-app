/**
 * Wraps an async route handler so any thrown error or rejected promise
 * is forwarded to Express's next(err), instead of needing a try/catch
 * in every controller function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
