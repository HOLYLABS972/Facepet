/**
 * Production-safe logging utility
 * Automatically strips console logs in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Safe logger that only logs in development
 */
export const logger = {
  debug: (message: string, data?: any) => {
    if (isDev) console.log(`[DEBUG] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    if (isDev) console.log(`[INFO] ${message}`, data);
  },
  warn: (message: string, data?: any) => {
    // Always log warnings
    console.warn(`[WARN] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    // Always log errors
    console.error(`[ERROR] ${message}`, error);
  },
};

/**
 * Performance monitoring - only enabled in dev or when explicitly enabled
 */
export const perfLogger = {
  startMeasure: (label: string) => {
    if (isDev && typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${label}-start`);
    }
  },
  endMeasure: (label: string) => {
    if (isDev && typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        if (measure) {
          console.log(`[PERF] ${label}: ${measure.duration.toFixed(2)}ms`);
        }
      } catch (e) {
        // Ignore measurement errors
      }
    }
  },
};
