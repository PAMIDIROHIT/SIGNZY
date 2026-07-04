# Architecture

This document describes the request flow of the Intelligent Vendor Routing Platform.

## Request Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant API as /route API (Controller)
    participant Engine as Routing Service
    participant DB as Prisma (SQLite)
    participant Strategy as Strategy Factory
    participant Vendor as Vendor Simulator

    Client->>API: POST /route { capability, payload, requirements }
    API->>Engine: routeRequest()
    Engine->>DB: Fetch Active Vendors & Routing Rule
    DB-->>Engine: Vendors List
    
    rect rgb(240, 248, 255)
        Note over Engine: Filtering Phase
        Engine->>Engine: Remove inactive
        Engine->>Engine: Check Circuit Breaker
        Engine->>Engine: Check Rate Limits
        Engine->>Engine: Check Features & Latency requirements
    end
    
    rect rgb(255, 240, 245)
        Note over Engine: Failover Loop (Max 3 tries)
        Engine->>Strategy: Apply Selected Strategy (e.g., Priority)
        Strategy-->>Engine: Vendor A
        
        Engine->>Vendor: Call Vendor A URL
        alt Vendor Fails (Timeout/500)
            Vendor-->>Engine: Error
            Engine->>Engine: Record Failure Metrics & Open Circuit
            Engine->>Strategy: Request Next Best Vendor
            Strategy-->>Engine: Vendor B
            Engine->>Vendor: Call Vendor B URL
            Vendor-->>Engine: Success Response
        else Vendor Succeeds
            Vendor-->>Engine: Success Response
        end
    end
    
    Engine->>Engine: Record Success Metrics
    Engine->>DB: Save RoutingLog (vendors considered, rejected, selected)
    Engine-->>API: Unified Standard Envelope
    API-->>Client: 200 OK { status: "SUCCESS", vendorUsed, response }
```

## Core Components
1. **Routing Service**: The orchestrator. Implements the failover loop.
2. **Strategy Factory**: Pure functions that take eligible vendors and return one.
3. **Metrics Engine**: An in-memory sliding window store capturing real-time latency and success rates to inform health-based and latency-based strategies.
4. **Circuit Breaker**: Prevents the system from making calls to a vendor that is known to be failing, saving valuable latency time.
