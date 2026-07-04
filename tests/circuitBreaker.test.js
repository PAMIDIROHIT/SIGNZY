import { circuitBreaker } from '../src/utils/circuitBreaker.js';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    circuitBreaker.reset();
  });

  test('should start in CLOSED state and allow execution', () => {
    const canExec = circuitBreaker.canExecute('vendor1');
    expect(canExec).toBe(true);
    expect(circuitBreaker.getState('vendor1')).toBe('CLOSED');
  });

  test('should open circuit after threshold failures', () => {
    // Record 5 failures
    for (let i = 0; i < 5; i++) {
      circuitBreaker.recordFailure('vendor1');
    }
    
    expect(circuitBreaker.getState('vendor1')).toBe('OPEN');
    expect(circuitBreaker.canExecute('vendor1')).toBe(false);
  });

  test('should reset failures on success', () => {
    circuitBreaker.recordFailure('vendor1');
    circuitBreaker.recordFailure('vendor1');
    
    circuitBreaker.recordSuccess('vendor1');
    
    // Fail 4 times, shouldn't open because it was reset
    for (let i = 0; i < 4; i++) {
      circuitBreaker.recordFailure('vendor1');
    }
    
    expect(circuitBreaker.getState('vendor1')).toBe('CLOSED');
    expect(circuitBreaker.canExecute('vendor1')).toBe(true);
  });
});
