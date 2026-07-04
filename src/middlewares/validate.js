import { z } from 'zod';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../config/logger.js';

/**
 * Express middleware to validate request body, query, or params using Zod.
 * @param {z.ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} property 
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req[property]);
      // Re-assign the validated data back to the request object
      // This ensures defaults are applied and extra fields are stripped (if configured in schema)
      req[property] = validatedData;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.warn('Validation error', { property, issues: err.issues });
        return sendError(res, 400, 'Validation Error', err.issues);
      }
      next(err);
    }
  };
};
