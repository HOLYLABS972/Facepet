import { checkEmailRateLimit } from './rate-limit';

/**
 * In-memory rate limiter (no external dependencies)
 * Replaces Upstash - uses local Map for rate limiting
 */
const ratelimit = {
  limit: async (ip: string) => {
    // Simple rate limit: 5 requests per minute per IP
    const now = Date.now();
    const key = `ip-${ip}`;
    
    // Check if this IP has been rate limited
    const record = (global as any).__ipRateLimits?.get(key);
    
    if (record && now - record.resetTime < 60000) {
      if (record.count >= 5) {
        return { success: false, remaining: 0 };
      }
      record.count++;
      return { success: true, remaining: 5 - record.count };
    }
    
    // Initialize rate limit for this IP
    if (!(global as any).__ipRateLimits) {
      (global as any).__ipRateLimits = new Map();
    }
    (global as any).__ipRateLimits.set(key, { count: 1, resetTime: now });
    return { success: true, remaining: 4 };
  }
};

export default ratelimit;
