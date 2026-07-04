/**
 * src/middlewares/clientRateLimiter.js
 * Basic rate limiting to protect OUR API from abuse.
 * In-memory counter by IP. 
 */
import { sendError } from '../utils/apiResponse.js';

const requests = new Map();

// 100 requests per IP per minute
const LIMIT = 100;
const WINDOW_MS = 60000;

export const clientRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  if (!requests.has(ip)) {
    requests.set(ip, { count: 1, windowStart: Date.now() });
    return next();
  }

  const record = requests.get(ip);
  const now = Date.now();

  if (now - record.windowStart > WINDOW_MS) {
    // Reset window
    record.count = 1;
    record.windowStart = now;
    return next();
  }

  if (record.count >= LIMIT) {
    return sendError(res, 429, 'Too many requests from this IP, please try again later.');
  }

  record.count += 1;
  next();
};
