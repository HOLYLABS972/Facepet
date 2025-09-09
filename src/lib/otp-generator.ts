/**
 * OTP (One-Time Password) generation utilities
 */

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random 4-digit OTP code
 */
export function generateShortOTPCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a random alphanumeric OTP code
 * @param length - Length of the code (default: 6)
 */
export function generateAlphanumericOTP(length: number = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate OTP code format (6 digits)
 */
export function isValidOTPCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Validate short OTP code format (4 digits)
 */
export function isValidShortOTPCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}
