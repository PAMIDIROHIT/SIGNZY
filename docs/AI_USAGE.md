# AI Agentic Bonus Implementation

This platform incorporates a powerful Agentic AI module (Phase 10) utilizing the **Groq SDK** and the **LLaMA 3.3 70B** model. 

The integration leverages the ultra-low latency of Groq to perform dynamic operations that traditional code struggles with, transforming the routing engine into an intelligent system.

## Features Implemented

1. **Strategic Recommendations (`POST /agent/recommend-strategy`)**
   The agent analyzes the live, real-time in-memory metrics of all vendors for a specific capability (Success Rate, Latency, Availability) and suggests which of the 8 routing strategies is currently the most optimal.

2. **Decision Explanation (`POST /agent/explain-decision`)**
   The routing engine logs complex decisions, especially during multi-stage failovers. This endpoint passes the raw JSON log entry to the LLM, which translates the technical routing sequence into plain English for non-technical stakeholders or audits.

3. **Proactive Health Detection (`GET /agent/detect-unhealthy`)**
   Instead of static threshold alerts, the LLM analyzes the entire landscape of vendor metrics to spot anomalies (e.g., "Vendor B is still marked healthy, but its latency has tripled compared to Vendor A, indicating degradation").

4. **Fallback Rule Generation (`POST /agent/suggest-fallback-rules`)**
   Given a capability and the list of registered vendors, the architect-agent suggests an optimal failover sequence (e.g., "Primary: Vendor A (fastest), Fallback: Vendor B (cheapest)").

5. **Natural Language Config Generation (`POST /agent/generate-config`)**
   Users can type plain English like *"Route 70% of traffic to Vendor A and 30% to Vendor B"*. The LLM parses this intent and returns a strictly formatted JSON object matching the `RoutingRule` schema (e.g., Strategy: `weighted`, Config: `{ "VendorA": 70, "VendorB": 30 }`). This includes a self-healing retry mechanism if the LLM fails to output valid JSON on the first try.
