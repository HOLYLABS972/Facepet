'use server';

import redis from '@/utils/database/redis';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  cacheHit?: boolean;
  error?: string;
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static readonly METRICS_KEY = 'performance:metrics';
  private static readonly METRICS_TTL = 86400; // 24 hours

  /**
   * Start timing an operation
   */
  static startTimer(operation: string): () => Promise<void> {
    const startTime = Date.now();
    
    return async (cacheHit?: boolean, error?: string) => {
      const duration = Date.now() - startTime;
      await this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        cacheHit,
        error
      });
    };
  }

  /**
   * Record a performance metric
   */
  private static async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `${this.METRICS_KEY}:${metric.operation}:${Date.now()}`;
      await redis.setex(key, this.METRICS_TTL, JSON.stringify(metric));
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${metric.operation}: ${metric.duration}ms ${metric.cacheHit ? '(cache hit)' : '(cache miss)'}`);
      }
    } catch (error) {
      console.error('Failed to record performance metric:', error);
    }
  }

  /**
   * Get performance metrics for analysis
   */
  static async getMetrics(operation?: string, hours: number = 24): Promise<PerformanceMetric[]> {
    try {
      const pattern = operation 
        ? `${this.METRICS_KEY}:${operation}:*`
        : `${this.METRICS_KEY}:*`;
      
      const keys = await redis.keys(pattern);
      const metrics: PerformanceMetric[] = [];
      
      for (const key of keys) {
        const data = await redis.get(key);
        if (data) {
          const metric = JSON.parse(data as string) as PerformanceMetric;
          const hoursAgo = (Date.now() - metric.timestamp) / (1000 * 60 * 60);
          
          if (hoursAgo <= hours) {
            metrics.push(metric);
          }
        }
      }
      
      return metrics.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return [];
    }
  }

  /**
   * Get performance summary
   */
  static async getPerformanceSummary(hours: number = 24): Promise<{
    operations: Record<string, {
      count: number;
      avgDuration: number;
      cacheHitRate: number;
      errorRate: number;
    }>;
  }> {
    const metrics = await this.getMetrics(undefined, hours);
    const summary: Record<string, any> = {};
    
    for (const metric of metrics) {
      if (!summary[metric.operation]) {
        summary[metric.operation] = {
          count: 0,
          totalDuration: 0,
          cacheHits: 0,
          errors: 0
        };
      }
      
      const op = summary[metric.operation];
      op.count++;
      op.totalDuration += metric.duration;
      
      if (metric.cacheHit) op.cacheHits++;
      if (metric.error) op.errors++;
    }
    
    // Calculate averages and rates
    const operations: Record<string, any> = {};
    for (const [operation, data] of Object.entries(summary)) {
      operations[operation] = {
        count: data.count,
        avgDuration: Math.round(data.totalDuration / data.count),
        cacheHitRate: Math.round((data.cacheHits / data.count) * 100),
        errorRate: Math.round((data.errors / data.count) * 100)
      };
    }
    
    return { operations };
  }
}

/**
 * Decorator for automatic performance monitoring
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const endTimer = PerformanceMonitor.startTimer(operation);
    let cacheHit = false;
    let error: string | undefined;
    
    try {
      const result = await fn(...args);
      
      // Try to detect cache hits (this is a simple heuristic)
      if (typeof result === 'object' && result?._fromCache) {
        cacheHit = true;
      }
      
      await endTimer(cacheHit);
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      await endTimer(cacheHit, error);
      throw err;
    }
  }) as T;
}

/**
 * Performance monitoring middleware for database queries
 */
export const monitorDatabaseQuery = <T>(operation: string) => {
  return async (queryFn: () => Promise<T>): Promise<T> => {
    const endTimer = PerformanceMonitor.startTimer(`db:${operation}`);
    
    try {
      const result = await queryFn();
      await endTimer(false); // Database queries are never cache hits
      return result;
    } catch (error) {
      await endTimer(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
};
