import { slidingWindowStore } from '../../metrics/slidingWindowStore.js';

/**
 * src/modules/routing/strategies/lowestLatencyStrategy.js
 * Selects the vendor with the lowest average latency from live metrics.
 */
export const lowestLatencyStrategy = (eligibleVendors) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  return eligibleVendors.reduce((prev, curr) => {
    const prevMetrics = slidingWindowStore.getMetrics(prev.id);
    const currMetrics = slidingWindowStore.getMetrics(curr.id);
    
    return currMetrics.avgLatencyMs < prevMetrics.avgLatencyMs ? curr : prev;
  });
};
