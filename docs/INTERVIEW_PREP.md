# 🚀 Interview Preparation Guide: Intelligent Vendor Routing Platform

This document is your cheat sheet and study guide for the technical interview. It explains the "what," "how," and "why" behind every line of code in this project, giving you the vocabulary and confidence to ace the interview.

---

## 1. The "Elevator Pitch" (How to introduce your project)
**When they ask: "Walk me through what you built."**

> "I built a production-grade backend API that acts as an intelligent gateway for third-party vendors. Instead of hardcoding vendor endpoints in our client apps, the client makes one unified request to this platform. The platform then dynamically routes the request to the best available vendor (like a KYC or OCR provider) based on live metrics, costs, and priority. I implemented 8 dynamic routing algorithms using the Strategy pattern, built a robust Failover loop with an in-memory Circuit Breaker, and topped it off with an Agentic AI module powered by Groq that can literally analyze system health and generate routing configurations from plain English."

---

## 2. The Request Flow (End-to-End)
**When they ask: "What happens when a request hits `POST /route`?"**

Here is the exact lifecycle of a request:

1. **Security & Validation (Middlewares):** 
   - The request first passes through `clientRateLimiter` (prevents DDoS).
   - It hits `validate.js` (Zod), which ensures the JSON payload is strictly formatted.
2. **Controller (`routing.controller.js`):** 
   - Receives the sanitized request and passes the `capability` and `requirements` down to the service layer.
3. **Fetching Data (`routing.service.js`):**
   - The engine queries the SQLite DB (via Prisma) to fetch all active vendors for that capability, and fetches the configured `RoutingRule` (e.g., "lowest_latency").
4. **Filtering (Pre-processing):**
   - The engine filters out vendors that are **Open in the Circuit Breaker** (currently down), vendors that exceed their **Rate Limit**, and vendors that don't meet the client's `maxLatencyMs` requirement.
5. **The Failover Loop (The Core Engine):**
   - We enter a `while` loop (max 3 attempts). 
   - We pass the eligible vendors into the **Strategy Factory**, which applies the chosen algorithm (e.g., Lowest Cost) and returns the single best vendor.
   - We execute an Axios call to the Vendor Simulator.
   - **If Success:** We break the loop and proceed.
   - **If Error (500/Timeout):** We record the failure in our metrics, trip the Circuit Breaker if threshold reached, mark the vendor as rejected, and loop again to find the *next* best vendor.
6. **Metrics & Logging:**
   - The latency and success/failure are pushed to the **Sliding Window Metric Store**.
   - A `RoutingLog` is saved to the database detailing exactly *why* vendors were picked or rejected.
7. **Response (`apiResponse.js`):**
   - The client receives a unified `200 OK` JSON wrapper containing the final vendor used and the data.

---

## 3. Database Schema & Purpose
I used **Prisma** (an advanced ORM) with **SQLite** for zero-config rapid prototyping, while maintaining the ability to swap to PostgreSQL with one line of code.

- **`Vendor` Table:** Stores static configuration (priority, weight, cost, API URL).
- **`RoutingRule` Table:** Maps a capability (e.g., "OCR") to an active strategy (e.g., "weighted") and holds JSON config (e.g., `{ "VendorA": 70, "VendorB": 30 }`).
- **`RoutingLog` Table:** The audit trail. Highly critical for fintechs to prove *why* a specific vendor was used for a specific user transaction.
- **`VendorMetricSnapshot` Table:** Since live metrics are kept in fast RAM, a background CRON job dumps them into this table every 60 seconds for historical charting.

---

## 4. Key Architectural Patterns Used
You need to drop these keywords during the interview to show seniority:

1. **Strategy Design Pattern:** 
   - Found in `src/modules/routing/strategies/`. Instead of massive `if/else` blocks, each routing logic (Priority, Round-Robin) is isolated in a pure function. The `strategyFactory.js` just plugs them in dynamically.
2. **Circuit Breaker Pattern:**
   - Found in `src/utils/circuitBreaker.js`. If a vendor fails 5 times in a row, we "OPEN" the circuit and stop sending them traffic for 30 seconds. **Why?** It prevents our system from waiting for a timeout on a known-dead vendor, drastically saving latency.
3. **Sliding Window Algorithm:**
   - Found in `slidingWindowStore.js`. It keeps a circular array of the last 100 requests in memory (`Map`). **Why?** Calculating average latency over the last 100 requests in RAM takes `O(1)` time. Querying a database for this on every request would crush the DB.

---

## 5. Top 10 Likely Interview Questions & Answers

### Q1. Why Node.js and Express for this project?
**Answer:** "Node.js uses an event-driven, non-blocking I/O model. Since this application is primarily an API Gateway proxying requests to downstream vendors, it spends most of its time waiting for network responses. Node handles high concurrency network I/O extremely efficiently without spawning heavy OS threads."

### Q2. How did you implement the "Weighted" routing strategy?
**Answer:** "I calculate the total sum of all weights for the eligible vendors. Then I generate a random number between 0 and that total. I loop through the vendors, accumulating their weights until the accumulated sum surpasses the random number. It mathematically guarantees traffic distribution exactly matching the weights."

### Q3. What happens if all vendors fail during a failover?
**Answer:** "The routing engine uses a strict `MAX_FAILOVER_ATTEMPTS` variable (set to 2 retries, 3 total calls). If all attempts fail, it throws a custom `RoutingExhaustedError`. This is caught by my global Express `errorHandler` middleware, which gracefully returns a `503 Service Unavailable` to the client instead of crashing the server."

### Q4. How do you handle PII (Personally Identifiable Information) in the logs?
**Answer:** "Security is critical. In `routing.service.js`, before saving the request payload to the database `RoutingLog`, I created a shallow copy and masked sensitive fields like `pan` or `aadhar` replacing them with `***`. This ensures we have an audit trail without leaking customer data in plain text."

### Q5. If we wanted to scale this to 10 instances behind a load balancer, what breaks?
**Answer:** "Right now, the Metrics Engine, Rate Limiter, and Circuit Breaker are stored in local Node memory (`Map` and variables). If we scale horizontally, Instance A won't know that Instance B tripped the circuit breaker. To fix this for production, I would migrate these in-memory stores to a centralized **Redis** cluster."

### Q6. Tell me about the Agentic AI Bonus features you built.
**Answer:** "I integrated the Groq SDK using LLaMA 3.3. Instead of just making an API wrapper, I gave the AI context. For example, the `generate-config` endpoint takes plain English like *'Send 70% to Vendor A'*, passes it to the LLM with a strict JSON schema prompt, and parses the output into a valid database routing rule. If the LLM hallucinates bad JSON, my code catches the parse error and sends a 'retry' prompt to self-correct."

### Q7. How did you test the system?
**Answer:** "I used Jest and Supertest. I didn't just write unit tests for the pure strategy functions; I wrote a full integration suite (`routing.integration.test.js`). It spins up an ephemeral Express server on a separate port, dynamically seeds the SQLite DB, and simulates a downstream vendor failure to mathematically prove that my failover loop catches the timeout and successfully routes to the backup vendor."

### Q8. Why did you use Zod for validation?
**Answer:** "Zod provides schema declaration and validation that fails fast. By validating the payload at the middleware level, I ensure that my controller and service layers never have to worry about missing fields or bad data types, keeping the core business logic incredibly clean."

### Q9. How do you calculate the "Health-Based" strategy?
**Answer:** "It's a composite scoring algorithm. I fetch the live metrics and calculate a score out of 100: 60% weight on Success Rate, 30% on Availability (Circuit status), and 10% on Inverse Latency. The vendor with the highest aggregate score wins."

### Q10. What was the hardest bug you faced?
**Answer:** *(Use the AI async bug!)* "When I was integrating the AI to recommend strategies based on live metrics, the AI kept responding that it had 'no data'. I realized that my `getLiveMetrics` function was asynchronous, and I forgot to `await` it before stringifying it into the prompt. So I was passing a pending JavaScript `Promise` to the LLM, which serializes as an empty object `{}`. Adding the `await` instantly fixed it and taught me a valuable lesson about LLM debugging—the AI is only as smart as the exact string you feed it."
