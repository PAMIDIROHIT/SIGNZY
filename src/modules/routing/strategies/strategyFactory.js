import { priorityStrategy } from './priorityStrategy.js';
import { weightedStrategy } from './weightedStrategy.js';
import { lowestLatencyStrategy } from './lowestLatencyStrategy.js';
import { lowestCostStrategy } from './lowestCostStrategy.js';
import { failoverStrategy } from './failoverStrategy.js';
import { roundRobinStrategy } from './roundRobinStrategy.js';
import { featureBasedStrategy } from './featureBasedStrategy.js';
import { healthBasedStrategy } from './healthBasedStrategy.js';

/**
 * src/modules/routing/strategies/strategyFactory.js
 * Returns the appropriate strategy function based on rule configuration.
 */
export const getStrategy = (strategyName) => {
  switch (strategyName?.toLowerCase()) {
    case 'weighted':
      return weightedStrategy;
    case 'lowest_latency':
      return lowestLatencyStrategy;
    case 'lowest_cost':
      return lowestCostStrategy;
    case 'failover':
      return failoverStrategy;
    case 'round_robin':
      return roundRobinStrategy;
    case 'feature_based':
      return featureBasedStrategy;
    case 'health_based':
      return healthBasedStrategy;
    case 'priority':
    default:
      return priorityStrategy;
  }
};
