// import { auth } from '@/auth'; // Removed - using Firebase Auth
import { getUserDetailsByEmail } from '@/utils/database/queries/users';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Routes that require email verification
 */
const PROTECTED_ROUTES = [
  '/pages/my-pets',
  '/pages/my-gifts',
  '/pages/services',
  '/pages/user/settings',
  '/pet/'
];

/**
 * Routes that should be accessible without email verification
 */
const PUBLIC_ROUTES = [
  '/auth/',
  '/api/',
  '/_next/',
  '/static/',
  '/favicon.ico'
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
 */
export async function emailVerificationMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if route doesn't require email verification
  if (!requiresEmailVerification(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get user session
    const session = await auth();
    
    if (!session || !session.user || !session.user.email) {
      // Redirect to sign in if not authenticated
      const signInUrl = new URL('/auth/sign-in', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check if email is verified
    const user = await getUserDetailsByEmail(session.user.email);
    
    if (!user || !user.emailVerified) {
      // Redirect to email verification page
      const verificationUrl = new URL('/auth/confirmation', request.url);
      verificationUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(verificationUrl);
    }

    // User is authenticated and email is verified
    return NextResponse.next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    
    // On error, redirect to sign in
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }
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
