/**
 * src/utils/asyncHandler.js
 * Wraps async express route handlers to catch unhandled promise rejections
 * and pass them to the express error handler middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
