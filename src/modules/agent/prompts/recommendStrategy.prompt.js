export const recommendStrategyPrompt = (capability, metrics) => `
You are an expert system administrator for an Intelligent Vendor Routing Platform.
Given the following live metrics for vendors supporting the capability "${capability}", recommend the best routing strategy.
Available strategies: Priority, Weighted, Lowest latency, Lowest cost, Failover, Round-robin, Feature-based, Health-based.

Current Metrics:
${JSON.stringify(metrics, null, 2)}

Provide your recommendation and a brief reasoning for why this strategy is best suited given the current conditions.
`;
