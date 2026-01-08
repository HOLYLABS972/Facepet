import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(req: NextRequest) {
  // Handle all POST requests - return 200 OK to prevent 405 errors
  if (req.method === 'POST') {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Handle internationalization for GET requests
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ]
};
