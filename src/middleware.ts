import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Handle all POST requests - return 200 OK
  if (req.method === 'POST') {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Pass through all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ]
};
