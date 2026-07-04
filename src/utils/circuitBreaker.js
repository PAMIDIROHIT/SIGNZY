/**
 * src/utils/circuitBreaker.js
 * Per-vendor state machine for circuit breaking.
 * States: 
 * - CLOSED: Normal, accepting traffic.
 * - OPEN: Failing, reject all traffic immediately.
 * - HALF_OPEN: Cooldown passed, allow ONE test request through.
 */

// Store format: { vendorId: { state, failureCount, nextTryTimestamp } }
const breakers = new Map();

// Configuration
const FAILURE_THRESHOLD = 5; // failures before opening circuit
const COOLDOWN_MS = 10000;   // 10 seconds before half-open

export const circuitBreaker = {
  /**
   * Check if we can route to this vendor based on circuit state.
   */
  canExecute(vendorId) {
    if (!breakers.has(vendorId)) {
      breakers.set(vendorId, { state: 'CLOSED', failureCount: 0, nextTryTimestamp: 0 });
    }

    const breaker = breakers.get(vendorId);

    if (breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      if (Date.now() >= breaker.nextTryTimestamp) {
        // Cooldown passed, transition to HALF_OPEN
        breaker.state = 'HALF_OPEN';
        return true; // allow the test request
      }
      return false; // Still cooling down
    }

    if (breaker.state === 'HALF_OPEN') {
      // We already let a test request through, reject others until we get a result
      return false;
    }

    return true;
  },

  /**
   * Record a success. Resets failure count and closes circuit if half-open.
   */
  recordSuccess(vendorId) {
    const breaker = breakers.get(vendorId);
    if (!breaker) return;

    breaker.failureCount = 0;
    breaker.state = 'CLOSED';
  },

  /**
   * Record a failure. Increments failure count, opens circuit if threshold crossed.
   */
  recordFailure(vendorId) {
    if (!breakers.has(vendorId)) {
      breakers.set(vendorId, { state: 'CLOSED', failureCount: 0, nextTryTimestamp: 0 });
    }

    const breaker = breakers.get(vendorId);

    breaker.failureCount += 1;

    if (breaker.state === 'HALF_OPEN' || breaker.failureCount >= FAILURE_THRESHOLD) {
      breaker.state = 'OPEN';
      breaker.nextTryTimestamp = Date.now() + COOLDOWN_MS;
    }
  },

  // For testing
  reset() {
    breakers.clear();
  },
  
  getState(vendorId) {
    return breakers.get(vendorId)?.state || 'CLOSED';
  }
};
