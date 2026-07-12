import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16 renamed "middleware" to "proxy" (same functionality, new file name
// + exported function name). This runs an OPTIMISTIC route guard based on the
// presence of the `token` cookie the client sets after sign-in. The real guard
// is client-side (see components/AuthGuard.tsx); this just avoids flashing a
// protected page or the login form to the wrong user.

const AUTH_COOKIE = 'token';
const PUBLIC_ROUTES = ['/login', '/register'];
const PROTECTED_PREFIXES = ['/dashboard', '/products'];

const matches = (pathname: string, routes: string[]) =>
  routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  // Root: send users where they belong.
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isAuthed ? '/dashboard' : '/login', request.url),
    );
  }

  // Unauthenticated users cannot see protected routes.
  if (matches(pathname, PROTECTED_PREFIXES) && !isAuthed) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users skip the auth pages.
  if (matches(pathname, PUBLIC_ROUTES) && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
