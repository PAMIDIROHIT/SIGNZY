export const explainDecisionPrompt = (logEntry) => `
You are an expert system administrator for an Intelligent Vendor Routing Platform.
Given the following routing decision log entry, explain in plain English why the system chose this specific vendor over the others. 
Do not invent any facts. Base your explanation strictly on the provided log data.

Routing Log Data:
Capability: ${logEntry.capability}
Strategy Used: ${logEntry.strategyUsed}
Vendors Considered: ${logEntry.vendorsConsidered}
Selected Vendor: ${logEntry.vendorSelected || 'None'}
Rejected Vendors and Reasons: ${logEntry.rejectedVendors}
System's Short Reason: ${logEntry.routingReason}

Please provide a concise, easy-to-understand explanation of the exact sequence of events that led to this decision.
`;
