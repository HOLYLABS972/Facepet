'use server';

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_TOKEN_NAME = 'csrf-token';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Set CSRF token in cookies
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: '/'
  });
  
  return token;
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value || null;
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
  const storedToken = await getCSRFToken();
  return storedToken === token;
}

/**
 * Clear CSRF token
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
}

/**
 * CSRF protection middleware for server actions
 */
export async function withCSRFProtection<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  csrfToken?: string
): Promise<R> {
  if (!csrfToken) {
    throw new Error('CSRF token is required');
  }
  
  const isValid = await validateCSRFToken(csrfToken);
  if (!isValid) {
    throw new Error('Invalid CSRF token');
  }
  
  return action(...arguments as any);
}

/**
 * Get CSRF token for client-side use
 */
export async function getCSRFTokenForClient(): Promise<{ token: string }> {
  let token = await getCSRFToken();
  
  if (!token) {
    token = await setCSRFToken();
  }
  
  return { token };
}
