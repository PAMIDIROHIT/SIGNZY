import { slidingWindowStore } from '../../metrics/slidingWindowStore.js';

/**
 * src/modules/routing/strategies/healthBasedStrategy.js
 * Selects the vendor with the best composite health score.
 * Score is a weighted combo: Success Rate (60%) + Availability (30%) + Inverse Latency (10%)
 */
export const healthBasedStrategy = (eligibleVendors) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  const calculateScore = (vendor) => {
    const metrics = slidingWindowStore.getMetrics(vendor.id);
    
    // Success rate (0-1)
    const successRateScore = metrics.successRate * 60;
    
    // Availability (0-1)
    const availabilityScore = (metrics.availabilityStatus === 'HEALTHY' ? 1 : 
                               metrics.availabilityStatus === 'DEGRADED' ? 0.5 : 0) * 30;
    
    // Latency (lower is better). Let's say 2000ms is worst (0), 0ms is best (10)
    const latencyScore = Math.max(0, 10 - (metrics.avgLatencyMs / 200));
    
    return successRateScore + availabilityScore + latencyScore;
  };
  
  return eligibleVendors.reduce((prev, curr) => 
    (calculateScore(curr) > calculateScore(prev)) ? curr : prev
  );
};
