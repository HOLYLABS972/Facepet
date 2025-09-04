import { auth } from '@/auth';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicRoutes = [
  '/',
  '/terms',
  '/too-fast',
  '/pet/[id]',
  '/pet/[id]/get-started',
  '/auth/forgot',
  '/auth/reset-password',
  '/auth/reset-password-sent'
];

const authRoutes = ['/auth/sign-in', '/auth/sign-up'];

const adminRoutes = ['/admin', '/admin/[...path]'];

const testPathnameRegex = (pages: string[], pathName: string): boolean => {
  // Replace dynamic routes with regex
  const pathsWithParams = pages.map((p) => p.replace(/\[.*?\]/g, '[^/]+'));

  return RegExp(
    `^(/(${routing.locales.join('|')}))?(${pathsWithParams.flatMap((p) => (p === '/' ? ['', '/'] : p)).join('|')})/?$`,
    'i'
  ).test(pathName);
};

const authMiddleware = auth(async (req) => {
  const isAuthPage = testPathnameRegex(authRoutes, req.nextUrl.pathname);
  const isAdminPage = testPathnameRegex(adminRoutes, req.nextUrl.pathname);
  const isLogged = !!req.auth;

  // Redirect to login page if not authenticated
  if (!isLogged && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.nextUrl));
  }

  // Redirect to home page if authenticated and trying to access auth pages
  if (isLogged && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Check email verification for authenticated users (except auth pages)
  if (isLogged && !isAuthPage) {
    try {
      const { isEmailVerified } = await import(
        './middleware/email-verification'
      );
      const userEmail = req.auth?.user?.email;

      if (userEmail) {
        const emailVerified = await isEmailVerified(userEmail);

        // Allow access to confirmation page even if email is not verified
        if (
          !emailVerified &&
          !req.nextUrl.pathname.includes('/auth/confirmation')
        ) {
          const confirmationUrl = new URL('/auth/confirmation', req.nextUrl);
          confirmationUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
          return NextResponse.redirect(confirmationUrl);
        }
      }
    } catch (error) {
      console.error('Email verification check failed:', error);
      // Continue without email verification check on error
    }
  }

  // Check role for admin routes
  if (isAdminPage) {
    const userRole = req.auth?.user?.role;

    // Only allow 'admin' and 'super_admin' to access admin pages
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  return intlMiddleware(req);
});

const middleware = (req: NextRequest) => {
  const isPublicPage = testPathnameRegex(publicRoutes, req.nextUrl.pathname);
  const isAuthPage = testPathnameRegex(authRoutes, req.nextUrl.pathname);
  const isAdminPage = testPathnameRegex(adminRoutes, req.nextUrl.pathname);

  if (isAuthPage || isAdminPage) {
    return (authMiddleware as any)(req);
  }

  if (isPublicPage) {
    return intlMiddleware(req);
  } else {
    return (authMiddleware as any)(req);
  }
};

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

export default middleware;
