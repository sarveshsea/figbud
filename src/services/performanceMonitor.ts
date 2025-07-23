// Performance Monitor - Tracks and reports on application performance metrics

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: 'ms' | 'MB' | '%' | 'fps';
  timestamp: Date;
  category: 'api' | 'render' | 'memory' | 'network';
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private observers: ((metric: PerformanceMetric) => void)[] = [];
  private apiCallTimes = new Map<string, number>();

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor memory usage every 5 seconds
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric({
          name: 'JS Heap Used',
          value: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
          unit: 'MB',
          category: 'memory'
        });
      }
    }, 5000);

    // Monitor frame rate
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        this.recordMetric({
          name: 'Frame Rate',
          value: fps,
          unit: 'fps',
          category: 'render'
        });
        
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // API Call Tracking
  startAPICall(endpoint: string): string {
    const id = `${endpoint}-${Date.now()}`;
    this.apiCallTimes.set(id, performance.now());
    return id;
  }

  endAPICall(id: string, success: boolean = true): void {
    const startTime = this.apiCallTimes.get(id);
    if (startTime) {
      const duration = performance.now() - startTime;
      const endpoint = id.split('-')[0];
      
      this.recordMetric({
        name: `API: ${endpoint}`,
        value: Math.round(duration),
        unit: 'ms',
        category: 'api'
      });
      
      this.apiCallTimes.delete(id);
    }
  }

  // Component Render Tracking
  measureRender(componentName: string, renderFn: () => void): void {
    const start = performance.now();
    renderFn();
    const duration = performance.now() - start;
    
    this.recordMetric({
      name: `Render: ${componentName}`,
      value: Math.round(duration),
      unit: 'ms',
      category: 'render'
    });
  }

  private recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    this.metrics.push(fullMetric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Notify observers
    this.observers.forEach(observer => observer(fullMetric));
  }

  // Public API
  onMetric(observer: (metric: PerformanceMetric) => void): void {
    this.observers.push(observer);
  }

  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category);
    }
    return [...this.metrics];
  }

  getRecentMetrics(count: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  getAverageMetric(name: string, timeWindowMs: number = 60000): number {
    const cutoff = Date.now() - timeWindowMs;
    const relevantMetrics = this.metrics.filter(m => 
      m.name === name && m.timestamp.getTime() > cutoff
    );
    
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round(sum / relevantMetrics.length);
  }

  getSummary(): {
    avgAPIResponseTime: number;
    avgRenderTime: number;
    currentMemoryUsage: number;
    currentFPS: number;
    slowestAPI: { name: string; time: number } | null;
  } {
    const apiMetrics = this.getMetrics('api');
    const renderMetrics = this.getMetrics('render');
    const memoryMetrics = this.getMetrics('memory');
    const fpsMetrics = this.getMetrics('render').filter(m => m.name === 'Frame Rate');
    
    // Find slowest API
    let slowestAPI: { name: string; time: number } | null = null;
    if (apiMetrics.length > 0) {
      const slowest = apiMetrics.reduce((prev, current) => 
        prev.value > current.value ? prev : current
      );
      slowestAPI = { name: slowest.name, time: slowest.value };
    }
    
    return {
      avgAPIResponseTime: this.getAverageMetric('API:', 60000),
      avgRenderTime: renderMetrics.length > 0 
        ? Math.round(renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length)
        : 0,
      currentMemoryUsage: (() => {
        const lastMemory = memoryMetrics[memoryMetrics.length - 1];
        return lastMemory ? lastMemory.value : 0;
      })(),
      currentFPS: (() => {
        const lastFPS = fpsMetrics[fpsMetrics.length - 1];
        return lastFPS ? lastFPS.value : 60;
      })(),
      slowestAPI
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();