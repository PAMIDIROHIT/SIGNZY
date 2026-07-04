import { priorityStrategy } from '../src/modules/routing/strategies/priorityStrategy.js';
import { weightedStrategy } from '../src/modules/routing/strategies/weightedStrategy.js';
import { lowestCostStrategy } from '../src/modules/routing/strategies/lowestCostStrategy.js';
import { roundRobinStrategy } from '../src/modules/routing/strategies/roundRobinStrategy.js';
import { failoverStrategy } from '../src/modules/routing/strategies/failoverStrategy.js';

describe('Routing Strategies', () => {
  const vendors = [
    { id: 'v1', name: 'VendorA', priority: 2, weight: 70, costPerRequest: 1.5 },
    { id: 'v2', name: 'VendorB', priority: 1, weight: 30, costPerRequest: 1.2 },
    { id: 'v3', name: 'VendorC', priority: 3, weight: 0, costPerRequest: 0.8 },
  ];

  test('priorityStrategy should pick lowest priority number', () => {
    const selected = priorityStrategy(vendors);
    expect(selected.name).toBe('VendorB'); // Priority 1
  });

  test('lowestCostStrategy should pick lowest cost', () => {
    const selected = lowestCostStrategy(vendors);
    expect(selected.name).toBe('VendorC'); // Cost 0.8
  });

  test('weightedStrategy should distribute based on weight', () => {
    // This is probabilistic, so we run it many times and check distribution
    let aCount = 0;
    let bCount = 0;
    
    for (let i = 0; i < 1000; i++) {
      const selected = weightedStrategy(vendors);
      if (selected.name === 'VendorA') aCount++;
      if (selected.name === 'VendorB') bCount++;
    }
    
    // VendorA (70%), VendorB (30%), VendorC (0%)
    expect(aCount).toBeGreaterThan(600); // Rough boundary
    expect(aCount).toBeLessThan(800);
    expect(bCount).toBeGreaterThan(200);
    expect(bCount).toBeLessThan(400);
  });

  test('failoverStrategy should return strictly priority sorted top element', () => {
    const selected = failoverStrategy(vendors);
    expect(selected.name).toBe('VendorB');
  });

  test('roundRobinStrategy should cycle vendors', () => {
    const ctx = { capability: 'TEST' };
    const first = roundRobinStrategy(vendors, ctx);
    const second = roundRobinStrategy(vendors, ctx);
    const third = roundRobinStrategy(vendors, ctx);
    const fourth = roundRobinStrategy(vendors, ctx);
    
    expect(first.id).toBe('v1');
    expect(second.id).toBe('v2');
    expect(third.id).toBe('v3');
    expect(fourth.id).toBe('v1'); // Cycles back
  });
});
