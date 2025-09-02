import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const middleware = (req: NextRequest) => {
  // For now, just handle internationalization
  // Authentication will be handled client-side with Firebase Auth
  return intlMiddleware(req);
};

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

export default middleware;
