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
  
  // Add cache-busting headers for mobile browsers (fixes Server Action cache issues)
  // Only for HTML pages, not static assets
  if (response && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
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
