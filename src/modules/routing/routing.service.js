import axios from 'axios';
import { prisma } from '../../db/prismaClient.js';
import { getStrategy } from './strategies/strategyFactory.js';
import { circuitBreaker } from '../../utils/circuitBreaker.js';
import { vendorRateLimiter } from '../../utils/vendorRateLimiter.js';
import { slidingWindowStore } from '../metrics/slidingWindowStore.js';

const MAX_FAILOVER_ATTEMPTS = 2;

export class RoutingExhaustedError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'RoutingExhaustedError';
    this.type = 'ROUTING_EXHAUSTED';
    this.details = details;
  }
}

/**
 * Filter vendors based on active status, features, rate limits, circuit breaker, and requirements.
 */
const filterVendors = (vendors, requestContext) => {
  const rejected = [];
  const eligible = [];

  for (const vendor of vendors) {
    if (!vendor.isActive) {
      rejected.push({ vendor: vendor.name, reason: 'Inactive' });
      continue;
    }

    if (!circuitBreaker.canExecute(vendor.id)) {
      rejected.push({ vendor: vendor.name, reason: 'Circuit breaker OPEN' });
      continue;
    }

    if (!vendorRateLimiter.consume(vendor.id, vendor.rateLimitPerMinute)) {
      rejected.push({ vendor: vendor.name, reason: 'Rate limit exceeded' });
      continue;
    }

    // Requirements check
    if (requestContext.requirements) {
      const reqs = requestContext.requirements;
      
      if (reqs.maxLatencyMs) {
        const metrics = slidingWindowStore.getMetrics(vendor.id);
        if (metrics.avgLatencyMs > reqs.maxLatencyMs) {
          rejected.push({ vendor: vendor.name, reason: `Latency ${metrics.avgLatencyMs.toFixed(0)}ms exceeds max ${reqs.maxLatencyMs}ms` });
          continue;
        }
      }

      if (reqs.features && reqs.features.length > 0) {
        let supported = [];
        try {
          supported = JSON.parse(vendor.supportedFeatures);
        } catch (e) {} // eslint-disable-line no-empty
        
        const hasAll = reqs.features.every(f => supported.includes(f));
        if (!hasAll) {
          rejected.push({ vendor: vendor.name, reason: 'Missing required features' });
          continue;
        }
      }
    }

    eligible.push(vendor);
  }

  return { eligible, rejected };
};

/**
 * Execute the routing flow.
 */
export const routeRequest = async (routeParams) => {
  const { capability, payload, requirements } = routeParams;
  const requestContext = { capability, payload, requirements };

  // 1. Fetch vendors
  const allVendors = await prisma.vendor.findMany({ where: { capability } });
  
  if (allVendors.length === 0) {
    throw new RoutingExhaustedError('No vendors registered for this capability.', { capability });
  }

  // 2. Fetch Routing Rule
  const rule = await prisma.routingRule.findUnique({ where: { capability } });
  const strategyName = rule ? rule.strategy : 'priority'; // default
  
  // 3. Track state across failover attempts
  let currentEligible = [...allVendors];
  const allRejected = [];
  const considered = allVendors.map(v => v.name);
  let attempts = 0;
  
  let finalVendor = null;
  let finalLatency = 0;
  let finalResponse = null;
  let routingReason = '';

  while (attempts <= MAX_FAILOVER_ATTEMPTS) {
    // 4. Filter
    const { eligible, rejected } = filterVendors(currentEligible, requestContext);
    allRejected.push(...rejected);
    
    if (eligible.length === 0) {
      break; // No more vendors to try
    }

    // 5. Select Vendor
    const strategyFn = getStrategy(strategyName);
    // Adjust strategy selection if requirements prefer low cost (override)
    let appliedStrategyFn = strategyFn;
    if (requirements?.preferLowCost) {
      appliedStrategyFn = getStrategy('lowest_cost');
    }
    
    const selectedVendor = appliedStrategyFn(eligible, requestContext);
    
    if (attempts === 0) {
      routingReason = `${selectedVendor.name} selected using ${requirements?.preferLowCost ? 'lowest_cost (override)' : strategyName} strategy.`;
    } else {
      routingReason = `${selectedVendor.name} selected after failover (Attempt ${attempts}).`;
    }

    // 6. Call Vendor
    const startTime = Date.now();
    try {
      // Setup AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), selectedVendor.timeoutMs);
      
      const response = await axios.post(selectedVendor.endpointUrl, payload, {
        signal: controller.signal,
        // add capability as query param just so our simulator knows what to return
        params: { capability },
        headers: { 'Content-Type': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      finalLatency = Date.now() - startTime;
      
      // Success!
      finalVendor = selectedVendor;
      finalResponse = response.data;
      
      circuitBreaker.recordSuccess(selectedVendor.id);
      slidingWindowStore.record(selectedVendor.id, true, finalLatency);
      
      break; // break out of failover loop

    } catch (error) {
      const latency = Date.now() - startTime;
      
      // Record failure
      circuitBreaker.recordFailure(selectedVendor.id);
      slidingWindowStore.record(selectedVendor.id, false, latency);
      
      const errorMsg = error.name === 'CanceledError' || error.code === 'ECONNABORTED' ? 'Timeout' : error.message;
      allRejected.push({ vendor: selectedVendor.name, reason: `Failed during call: ${errorMsg}` });
      
      // Remove this vendor from eligible list for the next attempt
      currentEligible = currentEligible.filter(v => v.id !== selectedVendor.id);
      attempts++;
    }
  }

  // 7. Log decision to DB
  const status = finalVendor ? 'SUCCESS' : 'FAILURE';
  
  // Mask sensitive data
  const sanitizedPayload = { ...payload };
  if (sanitizedPayload.pan) {
    sanitizedPayload.pan = 'MASKED';
  }

  await prisma.routingLog.create({
    data: {
      capability,
      requestPayload: JSON.stringify(sanitizedPayload),
      vendorsConsidered: JSON.stringify(considered),
      vendorSelected: finalVendor ? finalVendor.name : null,
      rejectedVendors: JSON.stringify(allRejected),
      strategyUsed: strategyName,
      status,
      latencyMs: finalLatency || null,
      cost: finalVendor ? finalVendor.costPerRequest : null,
      routingReason: finalVendor ? routingReason : 'All vendors failed or were filtered out.'
    }
  });

  // 8. Return or Throw
  if (!finalVendor) {
    throw new RoutingExhaustedError('All available vendors failed or were filtered out.', { 
      rejected: allRejected 
    });
  }

  return {
    vendorUsed: finalVendor.name,
    routingReason,
    latencyMs: finalLatency,
    cost: finalVendor.costPerRequest,
    response: finalResponse
  };
};
