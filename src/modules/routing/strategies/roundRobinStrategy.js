/**
 * src/modules/routing/strategies/roundRobinStrategy.js
 * Cycles evenly across eligible vendors.
 */

// Store format: { capability: lastUsedIndex }
const counters = new Map();

export const roundRobinStrategy = (eligibleVendors, requestContext) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  const capability = requestContext?.capability || 'UNKNOWN';
  
  let currentIndex = counters.get(capability) || 0;
  
  // Ensure index is within bounds (in case vendor list shrank)
  if (currentIndex >= eligibleVendors.length) {
    currentIndex = 0;
  }
  
  const selectedVendor = eligibleVendors[currentIndex];
  
  // Update counter for next time
  counters.set(capability, (currentIndex + 1) % eligibleVendors.length);
  
  return selectedVendor;
};
