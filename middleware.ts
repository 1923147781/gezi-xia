import { NextResponse, type NextRequest } from 'next/server';
import { decodeCookieValue, safeNextPath } from '@/lib/auth/cookies';
import { NICKNAME_COOKIE, PROTECTED_PREFIXES } from '@/lib/auth/constants';

function getNickname(request: NextRequest): string | null {
  return decodeCookieValue(request.cookies.get(NICKNAME_COOKIE)?.value);
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nickname = getNickname(request);
  const isLoggedIn = Boolean(nickname);
  const isLoginPage = pathname === '/login';

  if (pathname === '/') {
    return NextResponse.redirect(new URL(isLoggedIn ? '/dashboard' : '/login', request.url));
  }

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    const next = safeNextPath(request.nextUrl.searchParams.get('next'));
    const destination = next && isProtectedPath(next) ? next : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/groups/:path*', '/settings/:path*', '/invites/:path*'],
};
