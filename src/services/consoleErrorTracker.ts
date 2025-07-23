// Console Error Tracker - Intercepts and tracks console errors for debugging insights

export interface ConsoleError {
  id: string;
  timestamp: Date;
  type: 'error' | 'warn' | 'log';
  message: string;
  stack?: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  resolved?: boolean;
  suggestion?: string;
}

export class ConsoleErrorTracker {
  private errors: ConsoleError[] = [];
  private maxErrors = 100;
  private errorHandlers: ((error: ConsoleError) => void)[] = [];
  private originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log
  };

  constructor() {
    this.interceptConsole();
    this.interceptGlobalErrors();
  }

  private interceptConsole(): void {
    // Intercept console.error
    console.error = (...args: any[]) => {
      const error = this.createError('error', args);
      this.trackError(error);
      this.originalConsole.error.apply(console, args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      const error = this.createError('warn', args);
      this.trackError(error);
      this.originalConsole.warn.apply(console, args);
    };
  }

  private interceptGlobalErrors(): void {
    // Intercept unhandled errors
    window.addEventListener('error', (event: ErrorEvent) => {
      const error: ConsoleError = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        suggestion: this.generateSuggestion(event.message, event.error)
      };
      
      this.trackError(error);
    });

    // Intercept unhandled promise rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const error: ConsoleError = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        suggestion: this.generateSuggestion(event.reason?.toString() || '', event.reason)
      };
      
      this.trackError(error);
    });
  }

  private createError(type: ConsoleError['type'], args: any[]): ConsoleError {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const stack = new Error().stack;
    
    return {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      stack,
      suggestion: this.generateSuggestion(message)
    };
  }

  private trackError(error: ConsoleError): void {
    // Add to errors array
    this.errors.push(error);
    
    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify handlers
    this.errorHandlers.forEach(handler => handler(error));
  }

  private generateSuggestion(message: string, error?: any): string {
    // Common error patterns and suggestions
    const patterns = [
      {
        pattern: /cannot read prop.* of undefined/i,
        suggestion: 'Add null checks before accessing properties: if (obj && obj.property)'
      },
      {
        pattern: /cannot read prop.* of null/i,
        suggestion: 'Check if the object exists before accessing: obj?.property'
      },
      {
        pattern: /is not a function/i,
        suggestion: 'Verify the method exists and is properly imported'
      },
      {
        pattern: /network|fetch|api/i,
        suggestion: 'Check network connectivity and API endpoint availability'
      },
      {
        pattern: /timeout/i,
        suggestion: 'Consider increasing timeout duration or optimizing the operation'
      },
      {
        pattern: /type.*error/i,
        suggestion: 'Check TypeScript types and ensure proper type casting'
      },
      {
        pattern: /module not found/i,
        suggestion: 'Run npm install and check import paths'
      },
      {
        pattern: /permission denied/i,
        suggestion: 'Check file permissions and user access rights'
      }
    ];

    for (const { pattern, suggestion } of patterns) {
      if (pattern.test(message)) {
        return suggestion;
      }
    }

    // Generic suggestion
    return 'Check the stack trace for more details';
  }

  // Public API
  
  onError(handler: (error: ConsoleError) => void): void {
    this.errorHandlers.push(handler);
  }

  getErrors(): ConsoleError[] {
    return [...this.errors];
  }

  getRecentErrors(count: number = 10): ConsoleError[] {
    return this.errors.slice(-count);
  }

  getErrorsByType(type: ConsoleError['type']): ConsoleError[] {
    return this.errors.filter(e => e.type === type);
  }

  clearErrors(): void {
    this.errors = [];
  }

  markResolved(errorId: string, solution?: string): void {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      if (solution) {
        error.suggestion = solution;
      }
    }
  }

  getErrorSummary(): {
    total: number;
    errors: number;
    warnings: number;
    unresolved: number;
    patterns: { pattern: string; count: number }[];
  } {
    const summary = {
      total: this.errors.length,
      errors: this.errors.filter(e => e.type === 'error').length,
      warnings: this.errors.filter(e => e.type === 'warn').length,
      unresolved: this.errors.filter(e => !e.resolved).length,
      patterns: [] as { pattern: string; count: number }[]
    };

    // Find common patterns
    const patternCounts = new Map<string, number>();
    this.errors.forEach(error => {
      const key = error.message.substring(0, 50);
      patternCounts.set(key, (patternCounts.get(key) || 0) + 1);
    });

    patternCounts.forEach((count, pattern) => {
      if (count > 1) {
        summary.patterns.push({ pattern, count });
      }
    });

    summary.patterns.sort((a, b) => b.count - a.count);
    
    return summary;
  }

  // Restore original console methods
  restore(): void {
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.log = this.originalConsole.log;
  }
}

// Export singleton instance
export const consoleErrorTracker = new ConsoleErrorTracker();