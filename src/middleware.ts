import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match the root and all pathnames except API, Next internals, and files
  // with an extension (so `/` redirects to the default locale).
  matcher: ['/', '/((?!api|_next|_vercel|.*\\..*).*)']
};
