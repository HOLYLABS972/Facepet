/**
 * Rate limiting utilities for email sending
 * This file contains synchronous utility functions for rate limiting
 */

/**
 * Rate limiting for email sending
 */
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // Max 5 emails per 15 minutes per email

export function checkEmailRateLimit(email: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const record = emailRateLimit.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    emailRateLimit.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  emailRateLimit.set(key, record);
  return { allowed: true };
}

/**
 * Clean up expired rate limit records
 */
export function cleanupEmailRateLimit() {
  const now = Date.now();
  for (const [key, record] of emailRateLimit.entries()) {
    if (now > record.resetTime) {
      emailRateLimit.delete(key);
    }
  }
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus() {
  return {
    totalEntries: emailRateLimit.size,
    entries: Array.from(emailRateLimit.entries()).map(([email, record]) => ({
      email,
      count: record.count,
      resetTime: new Date(record.resetTime).toISOString()
    }))
  };
}

// Clean up rate limit records every hour (only on server side)
if (typeof window === 'undefined') {
  setInterval(cleanupEmailRateLimit, 60 * 60 * 1000);
}
