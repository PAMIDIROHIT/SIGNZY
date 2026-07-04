/**
 * src/modules/routing/strategies/failoverStrategy.js
 * Picks vendors in a strict priority order. The routing engine handles the
 * actual failover if the picked vendor fails, so this just returns the 
 * highest priority one from the CURRENTLY eligible list.
 */
export const failoverStrategy = (eligibleVendors) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  // Sort by priority (lowest number first)
  const sorted = [...eligibleVendors].sort((a, b) => a.priority - b.priority);
  return sorted[0];
};
