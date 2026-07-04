/**
 * src/middlewares/errorHandler.js
 * Global error handling middleware. Catches errors, logs them,
 * and returns standard JSON error response instead of HTML stack traces.
 */
import { logger } from '../config/logger.js';
import { sendError } from '../utils/apiResponse.js';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;
  
  // Do not leak stack traces in production
  const details = process.env.NODE_ENV === 'production' ? null : err.stack;
  
  // Specific handler if this was meant to be a vendor exhaustion
  if (err.type === 'ROUTING_EXHAUSTED') {
    return sendError(res, 503, 'All available vendors failed or were exhausted', err.details);
  }

  sendError(res, statusCode, err.message || 'Internal Server Error', details);
};
