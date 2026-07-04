import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/prismaClient.js';
import { circuitBreaker } from '../src/utils/circuitBreaker.js';
import { vendorRateLimiter } from '../src/utils/vendorRateLimiter.js';
import { slidingWindowStore } from '../src/modules/metrics/slidingWindowStore.js';

describe('Routing Engine Integration', () => {
  let vendorA, vendorB;

  beforeAll(async () => {
    // Cleanup DB
    await prisma.routingLog.deleteMany();
    await prisma.vendorMetricSnapshot.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.routingRule.deleteMany();

    // Setup Routing Rule (Priority)
    await prisma.routingRule.create({
      data: { capability: 'TEST_CAPABILITY', strategy: 'priority' }
    });

    // Create Vendors pointing to our simulator
    vendorA = await prisma.vendor.create({
      data: {
        name: 'SimVendorA',
        capability: 'TEST_CAPABILITY',
        endpointUrl: 'http://localhost:3001/simulate/SimVendorA/verify',
        priority: 1, // First priority
        timeoutMs: 1000
      }
    });

    vendorB = await prisma.vendor.create({
      data: {
        name: 'SimVendorB',
        capability: 'TEST_CAPABILITY',
        endpointUrl: 'http://localhost:3001/simulate/SimVendorB/verify',
        priority: 2, // Second priority (Failover)
        timeoutMs: 1000
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    circuitBreaker.reset();
    vendorRateLimiter.reset();
    slidingWindowStore.clear();
  });

  test('POST /route should successfully route to highest priority vendor', async () => {
    // App must be listening for Axios to hit localhost:3001 internally
    // We will start a temporary server just for the integration test
    const server = app.listen(3001);
    
    try {
      const payload = { test: 'data' };
      const response = await request(app)
        .post('/route')
        .send({ capability: 'TEST_CAPABILITY', payload });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('SUCCESS');
      expect(response.body.vendorUsed).toBe('SimVendorA');
      expect(response.body.response.handledBy).toBe('SimVendorA');
    } finally {
      server.close();
    }
  });

  test('POST /route should failover to vendor B if vendor A is down', async () => {
    const server = app.listen(3001);
    
    try {
      // Modify VendorA's endpoint to force a fail via simulator param
      await prisma.vendor.update({
        where: { id: vendorA.id },
        data: { endpointUrl: 'http://localhost:3001/simulate/SimVendorA/verify?isDown=true' }
      });

      const payload = { test: 'data' };
      const response = await request(app)
        .post('/route')
        .send({ capability: 'TEST_CAPABILITY', payload });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('SUCCESS');
      expect(response.body.vendorUsed).toBe('SimVendorB'); // Failed over!
      expect(response.body.routingReason).toContain('failover');
      
      // Cleanup update
      await prisma.vendor.update({
        where: { id: vendorA.id },
        data: { endpointUrl: 'http://localhost:3001/simulate/SimVendorA/verify' }
      });
    } finally {
      server.close();
    }
  });
});
