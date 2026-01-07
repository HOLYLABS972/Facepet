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

  // Handle POST requests to page routes (from prefetching, etc.)
  // Return 200 OK to prevent 405 errors
  if (method === 'POST') {
    // Check if this is an API route or Server Action
    const isApiRoute = pathname.startsWith('/api');
    const isServerAction = req.headers.get('content-type')?.includes('action') ||
                           req.headers.get('next-action');

    // Allow API routes and Server Actions to pass through
    if (isApiRoute || isServerAction) {
      return NextResponse.next();
    }

    // For POST requests to page routes, return a success response
    // This handles Next.js prefetching POST requests
    return NextResponse.json(
      {
        success: true,
        message: 'POST request acknowledged',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
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
