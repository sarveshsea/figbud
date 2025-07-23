/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures with configurable retry strategies
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;      // Initial delay in ms
  maxDelay?: number;          // Maximum delay in ms
  backoffMultiplier?: number; // Multiplier for exponential backoff
  jitter?: boolean;           // Add randomness to prevent thundering herd
  timeout?: number;           // Overall timeout for all retries
  retryableErrors?: (error: any) => boolean; // Function to determine if error is retryable
  onRetry?: (attempt: number, error: any, nextDelay: number) => void;
}

export class RetryError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: any,
    public errors: any[]
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    timeout,
    retryableErrors = defaultRetryableErrors,
    onRetry
  } = options;

  const errors: any[] = [];
  const startTime = Date.now();
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // Check overall timeout
      if (timeout && Date.now() - startTime > timeout) {
        throw new RetryError(
          `Retry timeout exceeded after ${attempt - 1} attempts`,
          attempt - 1,
          errors[errors.length - 1],
          errors
        );
      }

      // Execute the function
      return await fn();
    } catch (error) {
      errors.push(error);

      // Check if this is the last attempt
      if (attempt > maxRetries) {
        throw new RetryError(
          `Failed after ${maxRetries} retries`,
          maxRetries,
          error,
          errors
        );
      }

      // Check if error is retryable
      if (!retryableErrors(error)) {
        throw error; // Non-retryable error, fail immediately
      }

      // Calculate next delay
      const baseDelay = Math.min(delay, maxDelay);
      const actualDelay = jitter ? addJitter(baseDelay) : baseDelay;

      // Notify about retry
      if (onRetry) {
        onRetry(attempt, error, actualDelay);
      }

      // Log retry attempt
      console.warn(
        `[Retry] Attempt ${attempt}/${maxRetries} failed. Retrying in ${actualDelay}ms...`,
        error instanceof Error ? error.message : error
      );

      // Wait before retry
      await sleep(actualDelay);

      // Increase delay for next attempt
      delay *= backoffMultiplier;
    }
  }

  // This should never be reached
  throw new Error('Unexpected retry logic error');
}

/**
 * Default function to determine if an error is retryable
 */
function defaultRetryableErrors(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET') {
    return true;
  }

  // HTTP status codes that are retryable
  if (error.response) {
    const status = error.response.status;
    // 429 (Too Many Requests), 502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
    if (status === 429 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    // 500 (Internal Server Error) - sometimes retryable
    if (status === 500) {
      return true;
    }
  }

  // Rate limit errors
  if (error.message && (
    error.message.includes('rate limit') ||
    error.message.includes('Rate limit') ||
    error.message.includes('Too many requests')
  )) {
    return true;
  }

  // Timeout errors
  if (error.message && (
    error.message.includes('timeout') ||
    error.message.includes('Timeout')
  )) {
    return true;
  }

  // Default: don't retry
  return false;
}

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delay: number): number {
  // Add random jitter between -25% and +25%
  const jitterRange = delay * 0.25;
  const jitter = (Math.random() * 2 - 1) * jitterRange;
  return Math.round(delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry decorator for class methods
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Specialized retry strategies
 */
export class RetryStrategies {
  /**
   * Strategy for API calls
   */
  static apiCall(customOptions: Partial<RetryOptions> = {}): RetryOptions {
    return {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: (error) => {
        // API-specific retryable conditions
        if (defaultRetryableErrors(error)) return true;
        
        // Check for specific API error codes
        if (error.response?.data?.code === 'TEMPORARY_FAILURE') return true;
        
        return false;
      },
      ...customOptions
    };
  }

  /**
   * Strategy for database operations
   */
  static database(customOptions: Partial<RetryOptions> = {}): RetryOptions {
    return {
      maxRetries: 5,
      initialDelay: 100,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      jitter: true,
      retryableErrors: (error) => {
        // Database-specific retryable conditions
        if (error.code === 'ECONNREFUSED') return true;
        if (error.message?.includes('deadlock')) return true;
        if (error.message?.includes('connection pool')) return true;
        
        return false;
      },
      ...customOptions
    };
  }

  /**
   * Strategy for AI model calls
   */
  static aiModel(customOptions: Partial<RetryOptions> = {}): RetryOptions {
    return {
      maxRetries: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 3,
      jitter: true,
      timeout: 120000, // 2 minutes total
      retryableErrors: (error) => {
        if (defaultRetryableErrors(error)) return true;
        
        // AI-specific errors
        if (error.response?.status === 429) {
          // Check for Retry-After header
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter) {
            // Override delay if Retry-After is provided
            const delay = parseInt(retryAfter) * 1000;
            error.suggestedDelay = delay;
          }
          return true;
        }
        
        // Model overloaded
        if (error.message?.includes('model_overloaded')) return true;
        if (error.message?.includes('capacity')) return true;
        
        return false;
      },
      onRetry: (attempt, error, nextDelay) => {
        // Use suggested delay if available (from Retry-After header)
        if (error.suggestedDelay) {
          return error.suggestedDelay;
        }
      },
      ...customOptions
    };
  }

  /**
   * Strategy for file operations
   */
  static fileOperation(customOptions: Partial<RetryOptions> = {}): RetryOptions {
    return {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitter: false,
      retryableErrors: (error) => {
        // File operation specific errors
        if (error.code === 'EBUSY') return true;
        if (error.code === 'EMFILE') return true; // Too many open files
        if (error.code === 'ENFILE') return true; // File table overflow
        
        return false;
      },
      ...customOptions
    };
  }
}

/**
 * Utility to create a retryable version of a function
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    return retry(() => fn(...args), options);
  }) as T;
}