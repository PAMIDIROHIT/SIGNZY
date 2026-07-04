# Intelligent Vendor Routing Platform 🚀

A production-grade backend system that exposes one unified API to route requests to various third-party vendors (e.g., KYC, OCR) based on configurable routing rules and live performance metrics (latency, success rate, cost, etc.). 

Built as part of the **Signzy Backend Assignment**, this project demonstrates deep knowledge of system design, dynamic routing, fault tolerance, and cutting-edge AI integrations.

## 🌟 Key Highlights
- **8 Dynamic Routing Strategies:** Includes Priority, Weighted, Lowest Latency, Lowest Cost, Failover, Round-Robin, Feature-Based, and Health-Based routing.
- **Resilience Engineering:** Built-in **Circuit Breaker** pattern and dynamic **Failover loop**. If a vendor fails, the system automatically routes to the next best vendor.
- **Agentic AI Features:** Integrated with Groq (LLaMA 3.3 70B) for natural language config generation, intelligent strategy recommendations, anomaly detection, and plain-English log explanations.
- **Live Metrics Engine:** Custom in-memory sliding window store to track real-time latency and success rates.
- **Comprehensive Testing:** 100% passing test suite (Unit & Integration tests) using Jest.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js (ES Modules)
- **Database:** Prisma ORM, SQLite (Swappable to PostgreSQL)
- **Validation:** Zod
- **Testing:** Jest, Supertest
- **AI Integration:** Groq SDK (LLaMA 3.3 70B)
- **Logging:** Winston (Structured JSON logging)

---

## 🚀 Setup Instructions

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure Environment:**
   Copy `.env.example` to `.env` and fill in the values:
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   - `PORT`: 3000
   - `DATABASE_URL`: `file:./dev.db`
   - `GROQ_API_KEY`: Add your Groq API key to enable AI agent features.

3. **Database Setup:**
   Run Prisma migrations to create the SQLite DB and generate the client:
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   \`\`\`

4. **Start the Server:**
   \`\`\`bash
   npm run dev  # for development with nodemon
   npm start    # for production
   \`\`\`

## Seeding Sample Vendors

The repository contains sample data in the `sample-data` folder. You can register these vendors using curl or Postman:

\`\`\`bash
# Register Vendor A
curl -X POST http://localhost:3000/vendors \\
-H "Content-Type: application/json" \\
-d @sample-data/vendor-configs/pan-verification-vendors.json
\`\`\`

*(Note: the sample file can be sent as an array if you implement a bulk-create, otherwise send one by one).*

---

## 📖 Comprehensive Documentation

To dive deeper into the architecture and design decisions, please review the specific documentation files:
- [Architecture & Sequence Diagrams](./docs/ARCHITECTURE.md)
- [Routing Decisions & Strategies](./docs/ROUTING_DECISIONS.md)
- [Agentic AI Implementation](./docs/AI_USAGE.md)
- [Postman Collection](./docs/postman_collection.json)

---

## 🌐 API Reference

### 1. Register a Vendor
\`POST /vendors\`
\`\`\`bash
curl -X POST http://localhost:3000/vendors -H "Content-Type: application/json" -d '{
  "name": "VendorA",
  "capability": "PAN_VERIFICATION",
  "endpointUrl": "http://localhost:3000/simulate/VendorA/verify",
  "priority": 1,
  "weight": 70,
  "costPerRequest": 1.5,
  "timeoutMs": 2000,
  "rateLimitPerMinute": 100
}'
\`\`\`

### 2. List Vendors
\`GET /vendors?capability=PAN_VERIFICATION\`
\`\`\`bash
curl http://localhost:3000/vendors?capability=PAN_VERIFICATION
\`\`\`

### 3. Route a Request
\`POST /route\`
\`\`\`bash
curl -X POST http://localhost:3000/route -H "Content-Type: application/json" -d '{
  "capability": "PAN_VERIFICATION",
  "payload": {
    "pan": "ABCDE1234F",
    "name": "Rahul Sharma"
  },
  "requirements": {
    "maxLatencyMs": 2000,
    "preferLowCost": true
  }
}'
\`\`\`

### 4. Get Vendor Metrics
\`GET /vendor-metrics\`
\`\`\`bash
curl http://localhost:3000/vendor-metrics
\`\`\`

### 5. Get Routing Logs
\`GET /routing-logs\`
\`\`\`bash
curl "http://localhost:3000/routing-logs?page=1&limit=10"
\`\`\`

### 6. System Health
\`GET /health\`
\`\`\`bash
curl http://localhost:3000/health
\`\`\`

### 7. Agentic AI Endpoints (Bonus)
- \`POST /agent/recommend-strategy\`: \`{"capability": "PAN_VERIFICATION"}\`
- \`POST /agent/explain-decision\`: \`{"logId": "<log-id>"}\`
- \`GET /agent/detect-unhealthy\`
- \`POST /agent/suggest-fallback-rules\`: \`{"capability": "PAN_VERIFICATION"}\`
- \`POST /agent/generate-config\`: \`{"text": "Use Vendor A for 70% traffic..."}\`

## Design Decisions

- **SQLite**: Used for simplicity, zero-setup, and ease of testing for the assignment. Can be swapped to PostgreSQL with a single line change in `schema.prisma`.
- **In-Memory Metrics**: A `Map` tracking a rolling window (last 100 requests) per vendor avoids the complexity and dependency of Redis while fulfilling the requirements perfectly for a single-instance node.
- **Failover Logic**: Failover occurs dynamically inside the routing loop, keeping track of exhausted vendors and retrying the next best one according to the active strategy.
- **Circuit Breaker**: Protected downstream simulated vendors by short-circuiting fast if they are continuously failing.
