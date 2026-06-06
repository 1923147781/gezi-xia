import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NICKNAME_COOKIE, USER_ID_COOKIE } from '@/lib/auth/constants';

const CLEAR_COOKIE = { path: '/', maxAge: 0, sameSite: 'lax' as const };

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.set(NICKNAME_COOKIE, '', CLEAR_COOKIE);
  response.cookies.set(USER_ID_COOKIE, '', CLEAR_COOKIE);
  return response;
}
