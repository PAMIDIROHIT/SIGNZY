# Routing Decisions and Strategies

The platform implements 8 different routing strategies. Here is a brief explanation and worked numeric example for each.

## 1. Priority-based
**How it works:** Always selects the vendor with the lowest `priority` integer.
**Example:**
- Vendor A (Priority 1), Vendor B (Priority 2)
- **Result:** Vendor A is always selected first. If A fails, B is selected.

## 2. Weighted
**How it works:** Distributes traffic probabilistically based on assigned weights.
**Example:**
- Vendor A (Weight 70), Vendor B (Weight 30)
- **Result:** Over 100 requests, Vendor A gets ~70 requests, Vendor B gets ~30 requests.

## 3. Lowest Latency
**How it works:** Checks the live rolling metrics and picks the vendor with the lowest `avgLatencyMs`.
**Example:**
- Vendor A (Avg Latency: 250ms), Vendor B (Avg Latency: 100ms)
- **Result:** Vendor B is selected.

## 4. Lowest Cost
**How it works:** Picks the vendor with the lowest `costPerRequest`.
**Example:**
- Vendor A (Cost: 1.5), Vendor B (Cost: 0.8)
- **Result:** Vendor B is selected to optimize finances.

## 5. Failover
**How it works:** A strict ordered sequence. It acts similar to Priority but implies a sequence of fallback nodes.
**Example:**
- Vendor A is the primary. If A goes down, it falls back to Vendor B, then Vendor C.

## 6. Round-Robin
**How it works:** Evenly cycles through all eligible vendors.
**Example:**
- Request 1: Vendor A
- Request 2: Vendor B
- Request 3: Vendor A
- Request 4: Vendor B

## 7. Feature-Based
**How it works:** Filters vendors by matching the `requirements.features` in the request against the vendor's `supportedFeatures`.
**Example:**
- Client needs `["IMAGE_MATCH"]`. Vendor A has `["OCR"]`, Vendor B has `["OCR", "IMAGE_MATCH"]`.
- **Result:** Vendor A is discarded, Vendor B is selected.

## 8. Health-Based
**How it works:** Computes a composite health score dynamically: `Success Rate (60%) + Availability (30%) + Inverse Latency (10%)`.
**Example:**
- Vendor A (Success: 99%, Health: DEGRADED, Latency: 800ms) -> Score: 59.4 + 15 + 6 = 80.4
- Vendor B (Success: 100%, Health: HEALTHY, Latency: 150ms) -> Score: 60 + 30 + 9.25 = 99.25
- **Result:** Vendor B is selected.
