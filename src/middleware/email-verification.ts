// import { auth } from '@/auth'; // Removed - using Firebase Auth
import { getUserDetailsByEmail } from '@/utils/database/queries/users';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Routes that require email verification
 */
const PROTECTED_ROUTES = [
  '/pages/my-pets',
  '/pages/my-gifts',
  '/pages/user/settings',
  '/pet/[id]/edit',
  '/pet/[id]/nfc',
  '/pet/[id]/tag'
];

/**
 * Routes that should be accessible without email verification
 */
const PUBLIC_ROUTES = [
  '/auth/',
  '/api/',
  '/_next/',
  '/static/',
  '/favicon.ico',
  '/pet/', // Public pet viewing
  '/services' // Public services page
];

/**
 * Check if a route requires email verification
 */
function requiresEmailVerification(pathname: string): boolean {
  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return false;
  }

  // Check if it's a protected route
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Email verification middleware
 * DISABLED: Email verification is not required for now
 */
export async function emailVerificationMiddleware(request: NextRequest) {
  // Email verification is disabled - allow all authenticated users
  return NextResponse.next();
}

/**
 * Helper function to check if user's email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  try {
    const user = await getUserDetailsByEmail(email.toLowerCase());
    return user?.emailVerified || false;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

/**
 * Helper function to get email verification status for current user
 */
export async function getCurrentUserEmailVerification(): Promise<{
  isAuthenticated: boolean;
  isVerified: boolean;
  email?: string;
}> {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.email) {
      return { isAuthenticated: false, isVerified: false };
    }

    const isVerified = await isEmailVerified(session.user.email);
    
    return {
      isAuthenticated: true,
      isVerified,
      email: session.user.email
    };
  } catch (error) {
    console.error('Error getting current user email verification:', error);
    return { isAuthenticated: false, isVerified: false };
  }
}
