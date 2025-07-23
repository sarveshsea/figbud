/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by temporarily disabling calls to failing services
 */

export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation, requests allowed
  OPEN = 'OPEN',          // Service failing, requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;   // Number of failures before opening circuit
  resetTimeout?: number;       // Time in ms before attempting recovery
  monitoringPeriod?: number;   // Time window for counting failures
  successThreshold?: number;   // Successes needed in HALF_OPEN to close
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;
  private monitoringStart: number = Date.now();

  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly monitoringPeriod: number;
  private readonly successThreshold: number;
  private readonly onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;

  constructor(private name: string, options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 600000; // 10 minutes
    this.successThreshold = options.successThreshold || 3;
    this.onStateChange = options.onStateChange;
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if monitoring period has expired and reset if needed
    this.checkMonitoringPeriod();

    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`);
      }
      // Time to try again - move to HALF_OPEN
      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failures = 0; // Reset failure count on any success in CLOSED state

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in HALF_OPEN state reopens the circuit
      this.transitionTo(CircuitState.OPEN);
    } else if (this.failures >= this.failureThreshold) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;

    switch (newState) {
      case CircuitState.OPEN:
        this.nextAttempt = Date.now() + this.resetTimeout;
        console.warn(`[CircuitBreaker] ${this.name} is now OPEN. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
        break;
      
      case CircuitState.HALF_OPEN:
        this.successes = 0;
        console.info(`[CircuitBreaker] ${this.name} is now HALF_OPEN. Testing recovery...`);
        break;
      
      case CircuitState.CLOSED:
        this.failures = 0;
        this.successes = 0;
        console.info(`[CircuitBreaker] ${this.name} is now CLOSED. Service recovered.`);
        break;
    }

    if (this.onStateChange) {
      this.onStateChange(oldState, newState);
    }
  }

  /**
   * Check if monitoring period has expired
   */
  private checkMonitoringPeriod(): void {
    const now = Date.now();
    if (now - this.monitoringStart > this.monitoringPeriod) {
      // Reset counters for new monitoring period
      this.failures = 0;
      this.monitoringStart = now;
      
      // If circuit was OPEN and monitoring period expired, allow retry
      if (this.state === CircuitState.OPEN && now >= this.nextAttempt) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    nextAttemptTime: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttempt
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
  }

  /**
   * Force open the circuit (for testing or manual intervention)
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
  }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get status of all breakers
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    this.breakers.forEach((breaker, name) => {
      status[name] = breaker.getStats();
    });
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Remove a circuit breaker
   */
  removeBreaker(name: string): void {
    this.breakers.delete(name);
  }
}

// Export singleton instance
export const circuitBreakerManager = CircuitBreakerManager.getInstance();