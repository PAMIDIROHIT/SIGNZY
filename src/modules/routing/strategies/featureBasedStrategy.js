/**
 * src/modules/routing/strategies/featureBasedStrategy.js
 * Filters out vendors that don't support the required features, then applies priority.
 * Note: Initial filtering is actually done in routing engine now, but keeping this
 * as a distinct strategy in case we want a fallback.
 */
export const featureBasedStrategy = (eligibleVendors, requestContext) => {
  if (!eligibleVendors || eligibleVendors.length === 0) return null;
  
  const requiredFeatures = requestContext?.requirements?.features || [];
  
  const filtered = eligibleVendors.filter(vendor => {
    let supported = [];
    try {
      supported = typeof vendor.supportedFeatures === 'string' ? JSON.parse(vendor.supportedFeatures) : vendor.supportedFeatures;
    } catch(e) {
      // Ignore
    }
    return requiredFeatures.every(f => supported.includes(f));
  });
  
  if (filtered.length === 0) return null;
  
  // Fall back to priority for tie breaking
  return filtered.reduce((prev, curr) => (curr.priority < prev.priority) ? curr : prev);
};
