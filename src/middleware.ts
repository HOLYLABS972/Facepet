import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const middleware = (req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Check if the request is for admin routes
  const isAdminRoute = pathname.includes('/admin');

  if (isAdminRoute) {
    // For admin routes, we'll let the client-side handle authentication
    // but we can add additional server-side checks here if needed
    // For now, we'll just pass through to the client-side auth check
    console.log('Admin route accessed:', pathname);
  }

  // Handle internationalization for all routes
  const response = intlMiddleware(req);

  // Fix: Convert relative redirects to absolute for mobile browser compatibility
  // Some mobile browsers (especially on cellular networks) don't properly follow relative redirects
  if (response && response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location && location.startsWith('/')) {
      // Relative redirect detected - convert to absolute URL
      const absoluteUrl = new URL(location, req.url).toString();
      return NextResponse.redirect(absoluteUrl, response.status);
    }
  }

  // Smart caching that prevents mobile reload issues
  // Use private caching with immediate revalidation instead of aggressive no-cache
  // This prevents mobile browsers from force-reloading after Firebase auth initializes
  if (response && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
  }

  return response;
};

export const config = {
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - _next (Next.js internals)
    // - _static (inside /public)
    // - all root files inside /public (e.g. favicon.ico)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ]
};

export default middleware;
