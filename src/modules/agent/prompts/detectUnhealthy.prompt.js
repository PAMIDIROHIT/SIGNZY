export const detectUnhealthyPrompt = (metrics) => `
You are an expert site reliability engineer.
Review the following recent vendor metrics and identify any vendors that appear to be unhealthy or degraded.
Look for high error rates, unusually high latency, or low availability percent.

Metrics:
${JSON.stringify(metrics, null, 2)}

List any unhealthy vendors along with a brief explanation of why they are flagged. If all are healthy, just state that all vendors appear healthy.
`;
