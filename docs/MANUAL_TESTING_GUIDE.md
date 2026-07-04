# End-to-End Manual Testing Guide (Hoppscotch / Postman)

This guide will walk you through exactly how to test every single endpoint of the Intelligent Vendor Routing Platform, what the expected outputs are, and where the data is stored behind the scenes.

**Base URL:** `http://localhost:3000`

---

## 1. Check System Health
Start by verifying the server is up and running.

- **Method:** `GET`
- **URL:** `http://localhost:3000/health`
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "System is healthy",
    "data": {
      "uptime": 123.45,
      "timestamp": "2026-07-04T05:28:00.000Z"
    }
  }
  ```
- **Where is it saved?** Not saved to DB. It dynamically calculates uptime from `process.uptime()` in `src/modules/health/health.routes.js`.

---

## 2. Register Vendors
Before routing, you need to add vendors to the database.

- **Method:** `POST`
- **URL:** `http://localhost:3000/vendors`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "name": "Signzy_KYC",
    "capability": "PAN_VERIFICATION",
    "endpointUrl": "http://localhost:3000/simulate/Signzy_KYC/verify",
    "priority": 1,
    "weight": 70,
    "costPerRequest": 1.5,
    "timeoutMs": 2000,
    "rateLimitPerMinute": 100
  }
  ```
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Vendor registered successfully",
    "data": {
      "id": "cmr5...",
      "name": "Signzy_KYC",
      "isActive": true
      // ...other fields
    }
  }
  ```
- **Where is it saved?** Saved to the `Vendor` table in the SQLite database (`dev.db`). Code logic is in `src/modules/vendors/vendor.service.js`.

---

## 3. List Vendors
Verify that your vendors were saved successfully.

- **Method:** `GET`
- **URL:** `http://localhost:3000/vendors?capability=PAN_VERIFICATION`
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Vendors retrieved",
    "data": [
      {
        "name": "Signzy_KYC",
        "priority": 1
        // ...
      }
    ]
  }
  ```
- **Where is it saved?** Fetches from the `Vendor` table in `dev.db`.

---

## 4. Route a Request (The Core Engine)
This hits the core routing engine. It will find the best vendor, call the vendor simulator, and return the result.

- **Method:** `POST`
- **URL:** `http://localhost:3000/route`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
  ```json
  {
    "capability": "PAN_VERIFICATION",
    "payload": {
      "pan": "ABCDE1234F",
      "name": "Rahul Sharma"
    },
    "requirements": {
      "maxLatencyMs": 2000
    }
  }
  ```
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "vendorUsed": "Signzy_KYC",
    "routingReason": "Vendor selected based on PRIORITY strategy (Score: 1)",
    "latencyMs": 125,
    "cost": 1.5,
    "response": {
      "status": "VALID",
      "nameMatch": true,
      "handledBy": "Signzy_KYC"
    }
  }
  ```
- **Where is it saved?** 
  - A new entry is inserted into the `RoutingLog` table in `dev.db`. (Note: Sensitive payload fields like `pan` are masked as `***` in the DB for security).
  - Metrics (latency, success=true) are instantly pushed to the in-memory **Sliding Window Store** (`src/modules/metrics/slidingWindowStore.js`).
  - Code logic is in `src/modules/routing/routing.service.js`.

---

## 5. Test Failover (Edge Case)
Test what happens when a vendor is down. Add `?isDown=true` to the URL. (To test this, first register a second vendor with priority 2, but set the first vendor's URL to `http://localhost:3000/simulate/VendorA/verify?isDown=true`).

- Hit the `/route` API again.
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "vendorUsed": "VendorB",
    "routingReason": "Vendor selected after 1 failover attempts",
    "response": { ... }
  }
  ```

---

## 6. View Live Metrics
See the real-time latency and success rates calculated from the requests you just made.

- **Method:** `GET`
- **URL:** `http://localhost:3000/vendor-metrics`
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Live metrics retrieved",
    "data": [
      {
        "vendorName": "Signzy_KYC",
        "requestCount": 1,
        "successCount": 1,
        "errorCount": 0,
        "successRate": 1,
        "avgLatencyMs": 125
      }
    ]
  }
  ```
- **Where is it saved?** Fetched directly from Node.js RAM (`Map` object) via `src/modules/metrics/slidingWindowStore.js`. (Every 60 seconds, a background CRON job dumps this RAM data into the `VendorMetricSnapshot` table in `dev.db`).

---

## 7. Get Routing Logs
View the historical audit trail of all your routing decisions.

- **Method:** `GET`
- **URL:** `http://localhost:3000/routing-logs?page=1&limit=5`
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Routing logs retrieved",
    "data": [
      {
        "id": "cxyz...",
        "vendorSelected": "Signzy_KYC",
        "status": "SUCCESS",
        "latencyMs": 125,
        "requestPayload": "{\"pan\":\"***\",\"name\":\"Rahul Sharma\"}"
      }
    ]
  }
  ```
- **Where is it saved?** Fetches from the `RoutingLog` table in `dev.db`.

---

## 8. Agentic AI Integration
Test the Groq (LLaMA 3.3) AI integration.

### 8a. Generate Config from Plain English
- **Method:** `POST`
- **URL:** `http://localhost:3000/agent/generate-config`
- **Body (JSON):**
  ```json
  {
    "text": "Send 70% of traffic to Vendor A, and 30% to Vendor B."
  }
  ```
- **Expected Output:**
  ```json
  {
    "status": "SUCCESS",
    "message": "Config generated successfully",
    "data": {
      "config": {
        "strategy": "weighted",
        "config": {
          "Vendor A": 0.7,
          "Vendor B": 0.3
        }
      }
    }
  }
  ```

### 8b. Explain Routing Decision
Take an `id` from the `/routing-logs` response and ask the AI to explain it.
- **Method:** `POST`
- **URL:** `http://localhost:3000/agent/explain-decision`
- **Body (JSON):**
  ```json
  {
    "logId": "<paste_log_id_here>"
  }
  ```
- **Expected Output:**
  A plain English paragraph explaining exactly why the engine chose that vendor.

- **Where is this AI logic?** 
  Located in `src/modules/agent/agent.service.js`. It fetches data from the DB, injects it into a prompt (found in `src/modules/agent/prompts/`), and sends it to the Groq API.
