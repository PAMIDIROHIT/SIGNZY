export const suggestFallbackRulesPrompt = (capability, vendors) => `
You are an expert system architect.
Given the capability "${capability}" and the registered vendors:
${JSON.stringify(vendors, null, 2)}

Suggest a sensible fallback ordering (failover sequence) or fallback rules.
Explain why this sequence is robust.
`;
