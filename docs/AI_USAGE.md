# AI Usage & Implementation

This document outlines both how I utilized AI during the development of this assignment, and how the platform itself uses AI as a product feature.

## 🧑‍💻 Part 1: My Development Methodology (How I used AI)

As an engineer, I view AI as a powerful "pair programmer" and sounding board, but I strongly believe the developer must remain in the driver's seat for all architectural decisions. Here is exactly how I built this project:

### 1. Architecture & Tech Stack (100% Human)
Before writing any code, I manually broke down the problem statement and designed the system architecture. 
- I chose **Node.js/Express** for non-blocking asynchronous routing.
- I chose **Prisma with SQLite** because it allows for rapid prototyping without requiring the reviewer to set up a Dockerized PostgreSQL instance.
- I designed the modular folder structure (`src/modules/*`) to ensure the codebase remains maintainable and scalable.
- I chose to implement the **Strategy Design Pattern** for the 8 routing algorithms.

### 2. Exploring & Verifying Edge Cases (AI Assisted)
Routing systems are complex distributed systems. I leveraged AI to brainstorm and verify edge cases that I might have missed:
- **Example:** I used AI as a sounding board to discuss what happens if *all* failover vendors timeout in a row. This discussion led me to implement the strict `MAX_FAILOVER_ATTEMPTS` variable and the `RoutingExhaustedError` to prevent infinite loops and gracefully degrade the system.
- **Example:** I consulted AI on the pros and cons of using a full Redis instance vs. an in-memory Sliding Window for the Metrics Engine. We concluded the in-memory `Map` was sufficient and cleaner for this specific assignment scope.

### 3. Boilerplate & Speed (AI Accelerated)
Once I had the architecture and core logic mapped out in my head, I used AI to accelerate typing out repetitive boilerplate:
- Generating standard CRUD routes and controller scaffolding.
- Generating the initial structure for the Jest unit tests.

**Summary:** I owned the "what" and the "why" of the architecture. I used AI to accelerate the "how" and to stress-test my edge-case logic.

---

## 🤖 Part 2: Product Features (Agentic AI Bonus Module)

The platform itself incorporates a powerful Agentic AI module (Phase 10) utilizing the **Groq SDK** and the **LLaMA 3.3 70B** model. 

The integration leverages the ultra-low latency of Groq to perform dynamic operations that traditional code struggles with, transforming the routing engine into an intelligent system.

### Features Implemented

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
