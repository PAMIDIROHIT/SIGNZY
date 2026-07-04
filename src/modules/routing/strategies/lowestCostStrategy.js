/**
 * src/modules/routing/strategies/lowestCostStrategy.js
 * Selects the vendor with the lowest configured cost per request.
 */
export const lowestCostStrategy = (eligibleVendors) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  return eligibleVendors.reduce((prev, curr) => 
    (curr.costPerRequest < prev.costPerRequest) ? curr : prev
  );
};
