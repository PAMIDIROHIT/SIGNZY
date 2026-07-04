/**
 * src/modules/metrics/slidingWindowStore.js
 * In-memory rolling window for tracking live vendor metrics.
 * Uses a fixed-size window (last N requests) per vendor.
 */

const MAX_WINDOW_SIZE = 100;

// Store structure: { vendorId: { requests: [], successCount, errorCount } }
const store = new Map();

export const slidingWindowStore = {
  /**
   * Record a new request outcome for a vendor.
   * @param {string} vendorId 
   * @param {boolean} isSuccess 
   * @param {number} latencyMs 
   */
  record(vendorId, isSuccess, latencyMs) {
    if (!store.has(vendorId)) {
      store.set(vendorId, {
        requests: [],
        successCount: 0,
        errorCount: 0,
        totalLatency: 0
      });
    }

    const metrics = store.get(vendorId);
    
    // Add new request
    metrics.requests.push({ isSuccess, latencyMs, timestamp: Date.now() });
    metrics.totalLatency += latencyMs;
    if (isSuccess) metrics.successCount++;
    else metrics.errorCount++;

    // Slide window if it exceeds MAX_WINDOW_SIZE
    if (metrics.requests.length > MAX_WINDOW_SIZE) {
      const oldest = metrics.requests.shift();
      metrics.totalLatency -= oldest.latencyMs;
      if (oldest.isSuccess) metrics.successCount--;
      else metrics.errorCount--;
    }
  },

  /**
   * Get current computed metrics for a vendor.
   * @param {string} vendorId 
   */
  getMetrics(vendorId) {
    const metrics = store.get(vendorId);
    if (!metrics || metrics.requests.length === 0) {
      return {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        successRate: 1, // default 100% when no data
        errorRate: 0,
        avgLatencyMs: 0,
        availabilityStatus: 'HEALTHY'
      };
    }

    const requestCount = metrics.requests.length;
    const successRate = metrics.successCount / requestCount;
    const errorRate = metrics.errorCount / requestCount;
    const avgLatencyMs = metrics.totalLatency / requestCount;

    // Define thresholds for status
    // DEGRADED: Error rate > 10% or Latency > 2000ms
    // DOWN: Error rate > 50%
    let availabilityStatus = 'HEALTHY';
    if (errorRate >= 0.5) {
      availabilityStatus = 'DOWN';
    } else if (errorRate >= 0.1 || avgLatencyMs >= 2000) {
      availabilityStatus = 'DEGRADED';
    }

    return {
      requestCount,
      successCount: metrics.successCount,
      errorCount: metrics.errorCount,
      successRate,
      errorRate,
      avgLatencyMs,
      availabilityStatus
    };
  },
  
  /**
   * Get raw store (used for snapshotting)
   */
  getAllVendorIds() {
    return Array.from(store.keys());
  },
  
  /**
   * Clear the store (useful for tests)
   */
  clear() {
    store.clear();
  }
};
