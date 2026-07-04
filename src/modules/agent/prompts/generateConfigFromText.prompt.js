export const generateConfigFromTextPrompt = (text) => `
You are an AI configuration generator for an Intelligent Vendor Routing Platform.
Convert the following plain English requirement into a valid JSON object matching the routing configuration schema.

Input text: "${text}"

The expected JSON schema is:
{
  "strategy": "string (one of: weighted, lowest_latency, lowest_cost, failover, round_robin, feature_based, health_based, priority)",
  "config": {
    // any key-value pairs needed for the strategy, like weights, maxLatencyMs, errorRateThreshold, fallbackOrder
  }
}

Important Rules:
1. Output ONLY valid JSON.
2. Do NOT wrap it in markdown code blocks like \`\`\`json.
3. Do NOT add any extra conversational text.
4. If weights are mentioned, use "weighted" strategy and put the weights in the "config".
`;
