export interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number | null;
  state: 'open' | 'closed' | 'half-open';
  successCount?: number;
  lastSuccessTime?: number | null;
  consecutiveFailures?: number;
  backoffMultiplier?: number;
}

export class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly successThreshold: number;

  constructor(
    failureThreshold = 3,
    recoveryTimeout = 30000, // 30 seconds base timeout
    successThreshold = 2
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.successThreshold = successThreshold;
  }

  getState(key: string): CircuitBreakerState {
    if (!this.states.has(key)) {
      this.states.set(key, {
        failures: 0,
        lastFailureTime: null,
        state: 'closed',
        successCount: 0,
        lastSuccessTime: null,
        consecutiveFailures: 0,
        backoffMultiplier: 1
      });
    }
    
    const state = this.states.get(key)!;
    
    // Check if we should transition from open to half-open
    if (state.state === 'open' && state.lastFailureTime) {
      const timeSinceFailure = Date.now() - state.lastFailureTime;
      // Use exponential backoff for recovery timeout
      const backoffTimeout = this.recoveryTimeout * (state.backoffMultiplier || 1);
      if (timeSinceFailure >= backoffTimeout) {
        state.state = 'half-open';
        state.successCount = 0;
      }
    }
    
    return state;
  }

  recordSuccess(key: string): void {
    const state = this.getState(key);
    state.lastSuccessTime = Date.now();
    
    if (state.state === 'half-open') {
      state.successCount = (state.successCount || 0) + 1;
      
      // Transition to closed after enough successes
      if (state.successCount >= this.successThreshold) {
        state.state = 'closed';
        state.failures = 0;
        state.successCount = 0;
        state.consecutiveFailures = 0;
        state.backoffMultiplier = 1;
        console.log(`[CircuitBreaker] ${key} recovered and closed`);
      }
    } else if (state.state === 'closed') {
      // Reset failure count on success
      state.failures = 0;
      state.consecutiveFailures = 0;
      state.backoffMultiplier = 1;
    }
  }

  recordFailure(key: string): void {
    const state = this.getState(key);
    state.failures++;
    state.consecutiveFailures = (state.consecutiveFailures || 0) + 1;
    state.lastFailureTime = Date.now();
    
    if (state.state === 'half-open') {
      // Immediately open on failure in half-open state
      state.state = 'open';
      // Increase backoff multiplier (exponential backoff)
      state.backoffMultiplier = Math.min((state.backoffMultiplier || 1) * 2, 8); // Max 8x backoff
      console.log(`[CircuitBreaker] ${key} failed in half-open state, reopening with ${state.backoffMultiplier}x backoff`);
    } else if (state.state === 'closed' && state.failures >= this.failureThreshold) {
      // Open the circuit after too many failures
      state.state = 'open';
      console.log(`[CircuitBreaker] ${key} opened after ${state.failures} failures`);
    }
  }

  isOpen(key: string): boolean {
    const state = this.getState(key);
    return state.state === 'open';
  }

  isAvailable(key: string): boolean {
    const state = this.getState(key);
    return state.state !== 'open';
  }

  reset(key: string): void {
    this.states.set(key, {
      failures: 0,
      lastFailureTime: null,
      state: 'closed',
      successCount: 0,
      lastSuccessTime: null,
      consecutiveFailures: 0,
      backoffMultiplier: 1
    });
  }

  resetAll(): void {
    this.states.clear();
  }

  getStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {};
    this.states.forEach((state, key) => {
      stats[key] = { ...state };
    });
    return stats;
  }
}