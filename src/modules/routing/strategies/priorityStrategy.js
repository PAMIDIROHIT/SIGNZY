/**
 * src/modules/routing/strategies/priorityStrategy.js
 * Selects the vendor with the lowest priority number.
 */
export const priorityStrategy = (eligibleVendors) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  return eligibleVendors.reduce((prev, curr) => 
    (curr.priority < prev.priority) ? curr : prev
  );
};
