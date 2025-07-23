import { BaseAgent, AgentTask } from './BaseAgent';

interface ErrorLog {
  id: string;
  timestamp: Date;
  type: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: any;
  resolved?: boolean;
  solution?: string;
}

export class DebuggerAgent extends BaseAgent {
  private errorLogs: ErrorLog[] = [];
  private performanceIssues: any[] = [];
  private consoleInterceptor: any = null;

  constructor() {
    super('Debugger', 'Error Detection & Resolution');
    this.setupErrorTracking();
  }

  getCapabilities(): string[] {
    return [
      'error_tracking',
      'performance_profiling',
      'memory_leak_detection',
      'console_monitoring',
      'stack_trace_analysis',
      'automated_fixes'
    ];
  }

  async processTask(task: AgentTask): Promise<any> {
    this.startTask(task.id);

    try {
      switch (task.type) {
        case 'debug':
          return await this.debugIssue(task);
        case 'research':
          return await this.analyzeErrors(task);
        default:
          return await this.generalDebug(task);
      }
    } catch (error) {
      this.failTask(task.id, error.message);
      throw error;
    }
  }

  private setupErrorTracking(): void {
    // In a real implementation, this would hook into the actual console
    // For now, we'll simulate error tracking
    setInterval(() => {
      this.checkForErrors();
    }, 5000);
  }

  private async debugIssue(task: AgentTask): Promise<any> {
    const errorPattern = task.description;
    
    // Analyze recent errors
    const relevantErrors = this.errorLogs.filter(log => 
      log.message.includes(errorPattern) || 
      log.stack?.includes(errorPattern)
    );

    // Simulate debugging process
    const analysis = {
      pattern: errorPattern,
      occurrences: relevantErrors.length,
      firstSeen: relevantErrors[0]?.timestamp,
      lastSeen: relevantErrors[relevantErrors.length - 1]?.timestamp,
      rootCause: this.identifyRootCause(relevantErrors),
      suggestedFix: this.generateFix(relevantErrors),
      preventionSteps: [
        'Add input validation',
        'Implement error boundaries',
        'Add proper null checks',
        'Improve error messaging'
      ]
    };

    // Mark errors as resolved
    relevantErrors.forEach(error => {
      error.resolved = true;
      error.solution = analysis.suggestedFix;
    });

    this.completeTask(task.id, analysis);
    return analysis;
  }

  private async analyzeErrors(task: AgentTask): Promise<any> {
    const recentErrors = this.errorLogs.slice(-50);
    
    const analysis = {
      totalErrors: recentErrors.length,
      errorTypes: this.categorizeErrors(recentErrors),
      patterns: this.findErrorPatterns(recentErrors),
      criticalIssues: recentErrors.filter(e => 
        e.message.includes('CRITICAL') || 
        e.message.includes('FATAL')
      ),
      recommendations: [
        'Implement global error handler',
        'Add retry logic for network requests',
        'Improve error recovery mechanisms',
        'Add better logging for debugging'
      ],
      performanceIssues: this.performanceIssues
    };

    this.completeTask(task.id, analysis);
    return analysis;
  }

  private async generalDebug(task: AgentTask): Promise<any> {
    // General debugging approach
    const debugSteps = [
      'Collected error logs',
      'Analyzed stack traces',
      'Identified problematic code sections',
      'Suggested improvements',
      'Provided fix implementation'
    ];

    const result = {
      task: task.description,
      steps: debugSteps,
      findings: {
        errors: this.errorLogs.length,
        warnings: this.errorLogs.filter(e => e.type === 'warning').length,
        resolved: this.errorLogs.filter(e => e.resolved).length
      }
    };

    this.completeTask(task.id, result);
    return result;
  }

  private identifyRootCause(errors: ErrorLog[]): string {
    if (errors.length === 0) return 'No errors found';
    
    // Simple heuristic for root cause
    const commonPatterns = [
      { pattern: /undefined|null/i, cause: 'Null reference error' },
      { pattern: /network|fetch|api/i, cause: 'Network connectivity issue' },
      { pattern: /timeout/i, cause: 'Operation timeout' },
      { pattern: /memory|heap/i, cause: 'Memory leak or overflow' },
      { pattern: /type|cast/i, cause: 'Type mismatch error' }
    ];

    for (const { pattern, cause } of commonPatterns) {
      if (errors.some(e => pattern.test(e.message))) {
        return cause;
      }
    }

    return 'Unknown root cause - requires manual investigation';
  }

  private generateFix(errors: ErrorLog[]): string {
    if (errors.length === 0) return 'No fix needed';

    const firstError = errors[0];
    
    // Generate contextual fixes
    if (firstError.message.includes('undefined')) {
      return 'Add null checks: if (variable && variable.property) { ... }';
    }
    if (firstError.message.includes('network')) {
      return 'Implement retry logic with exponential backoff';
    }
    if (firstError.message.includes('timeout')) {
      return 'Increase timeout duration or optimize the operation';
    }

    return 'Manual investigation required for complex issue';
  }

  private categorizeErrors(errors: ErrorLog[]): Record<string, number> {
    const categories: Record<string, number> = {
      network: 0,
      validation: 0,
      runtime: 0,
      syntax: 0,
      other: 0
    };

    errors.forEach(error => {
      if (error.message.match(/network|fetch|api/i)) categories.network++;
      else if (error.message.match(/validation|invalid/i)) categories.validation++;
      else if (error.message.match(/runtime|execution/i)) categories.runtime++;
      else if (error.message.match(/syntax|parse/i)) categories.syntax++;
      else categories.other++;
    });

    return categories;
  }

  private findErrorPatterns(errors: ErrorLog[]): string[] {
    const patterns: string[] = [];
    
    // Check for repeated errors
    const errorCounts = new Map<string, number>();
    errors.forEach(error => {
      const key = error.message.substring(0, 50);
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    errorCounts.forEach((count, message) => {
      if (count > 3) {
        patterns.push(`Repeated error (${count}x): ${message}...`);
      }
    });

    return patterns;
  }

  private checkForErrors(): void {
    // Simulate error detection
    if (Math.random() < 0.1) {
      const mockError: ErrorLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'error',
        message: this.generateMockError(),
        stack: 'at Function.processTask (BackendEngineerAgent.ts:45)',
        resolved: false
      };
      
      this.errorLogs.push(mockError);
      
      // Alert manager of critical errors
      if (mockError.message.includes('CRITICAL')) {
        this.sendMessage('Manager', 'collaboration', {
          alert: 'Critical error detected',
          error: mockError
        });
      }
    }
  }

  private generateMockError(): string {
    const errors = [
      'Cannot read property "id" of undefined',
      'Network request failed: timeout after 30s',
      'CRITICAL: Memory usage exceeded 90%',
      'API rate limit exceeded',
      'Invalid type: expected string, got number'
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }

  // Public method for external error reporting
  reportError(error: Error, context?: any): void {
    const errorLog: ErrorLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'error',
      message: error.message,
      stack: error.stack,
      context,
      resolved: false
    };
    
    this.errorLogs.push(errorLog);
  }

  getErrorSummary(): any {
    return {
      total: this.errorLogs.length,
      unresolved: this.errorLogs.filter(e => !e.resolved).length,
      critical: this.errorLogs.filter(e => e.message.includes('CRITICAL')).length,
      recentErrors: this.errorLogs.slice(-10)
    };
  }
}