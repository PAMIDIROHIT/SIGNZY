/**
 * src/utils/vendorRateLimiter.js
 * In-memory fixed-window counter to enforce vendor rate limits.
 */

// Store format: { vendorId: { windowStart: Date.now(), count: 0 } }
const limiters = new Map();

export const vendorRateLimiter = {
  /**
   * Check if a request can be sent to this vendor based on its limit.
   * If allowed, increments the counter.
   * @param {string} vendorId 
   * @param {number} rateLimitPerMinute 
   * @returns {boolean} true if allowed, false if rate limited
   */
  consume(vendorId, rateLimitPerMinute) {
    const now = Date.now();
    
    if (!limiters.has(vendorId)) {
      limiters.set(vendorId, { windowStart: now, count: 1 });
      return true;
    }

    const limiter = limiters.get(vendorId);

    // Reset window if 1 minute has passed
    if (now - limiter.windowStart >= 60000) {
      limiter.windowStart = now;
      limiter.count = 1;
      return true;
    }

    // Check if within limit
    if (limiter.count < rateLimitPerMinute) {
      limiter.count += 1;
      return true;
    }

    // Rate limit exceeded
    return false;
  },

  // For testing
  reset() {
    limiters.clear();
  }
};
