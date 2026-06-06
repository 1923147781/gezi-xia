import { NextResponse } from 'next/server';
import { NICKNAME_COOKIE, USER_ID_COOKIE } from '@/lib/auth/constants';

const CLEAR_COOKIE = { path: '/', maxAge: 0, sameSite: 'lax' as const };

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(NICKNAME_COOKIE, '', CLEAR_COOKIE);
  response.cookies.set(USER_ID_COOKIE, '', CLEAR_COOKIE);
  return response;
}
