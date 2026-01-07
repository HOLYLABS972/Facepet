import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const middleware = (req: NextRequest) => {
  const { pathname, searchParams } = req.nextUrl;
  const method = req.method;

  // Check if the request is for admin routes
  const isAdminRoute = pathname.includes('/admin');

  if (isAdminRoute) {
    // For admin routes, we'll let the client-side handle authentication
    // but we can add additional server-side checks here if needed
    // For now, we'll just pass through to the client-side auth check
    console.log('Admin route accessed:', pathname);
  }

  // Allow POST requests (Server Actions) to pass through without i18n redirect
  if (method === 'POST') {
    return NextResponse.next();
  }

  // Handle internationalization for all routes
  const response = intlMiddleware(req);
  response.headers.delete('Vary');
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
