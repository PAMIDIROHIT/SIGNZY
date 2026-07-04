import { slidingWindowStore } from './slidingWindowStore.js';
import { prisma } from '../../db/prismaClient.js';
import { logger } from '../../config/logger.js';

/**
 * Get current live metrics for all vendors, optionally filtered by capability.
 */
export const getLiveMetrics = async (capability) => {
  // We need to know which vendors belong to the capability.
  const query = {};
  if (capability) {
    query.where = { capability };
  }
  
  const vendors = await prisma.vendor.findMany({
    ...query,
    select: { id: true, name: true, capability: true }
  });
  
  const metricsReport = vendors.map(v => {
    const metrics = slidingWindowStore.getMetrics(v.id);
    return {
      vendorId: v.id,
      vendorName: v.name,
      capability: v.capability,
      ...metrics
    };
  });
  
  return metricsReport;
};

/**
 * Flush current in-memory metrics to the database as a snapshot.
 * This runs periodically via a setInterval.
 */
export const flushMetricsSnapshot = async () => {
  const vendorIds = slidingWindowStore.getAllVendorIds();
  const now = new Date();
  
  // We consider the window to be the last 60 seconds (or however often this runs)
  const windowStart = new Date(now.getTime() - 60000); 
  
  for (const vendorId of vendorIds) {
    const metrics = slidingWindowStore.getMetrics(vendorId);
    
    // Only save snapshot if there were requests
    if (metrics.requestCount > 0) {
      try {
        await prisma.vendorMetricSnapshot.create({
          data: {
            vendorId,
            windowStart,
            windowEnd: now,
            requestCount: metrics.requestCount,
            successCount: metrics.successCount,
            errorCount: metrics.errorCount,
            avgLatencyMs: metrics.avgLatencyMs,
            availabilityPercent: metrics.successRate * 100
          }
        });
      } catch (err) {
        logger.error(`Failed to save metric snapshot for vendor ${vendorId}`, err);
      }
    }
  }
};

// Start the background job to flush metrics every 60 seconds
if (process.env.NODE_ENV !== 'test') {
  setInterval(flushMetricsSnapshot, 60000);
}
