/**
 * src/config/logger.js
 * Configures Winston for structured JSON logging to console and file.
 */
import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    errors({ stack: true }), // Include stack trace in error logs
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If not in production, log to console in a readable format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} ${level}: ${stack || message}`;
        })
      ),
    })
  );
}
