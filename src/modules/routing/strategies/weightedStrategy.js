/**
 * src/modules/routing/strategies/weightedStrategy.js
 * Probabilistic selection based on vendor weights.
 */
export const weightedStrategy = (eligibleVendors) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  const totalWeight = eligibleVendors.reduce((sum, vendor) => sum + (vendor.weight || 0), 0);
  
  if (totalWeight === 0) {
    // If all weights are 0, fallback to first available
    return eligibleVendors[0];
  }

  let random = Math.random() * totalWeight;
  
  for (const vendor of eligibleVendors) {
    random -= (vendor.weight || 0);
    if (random <= 0) {
      return vendor;
    }
  }
  
  return eligibleVendors[eligibleVendors.length - 1];
};
