import { NextResponse } from 'next/server';
import { COOKIE_OPTIONS, NICKNAME_COOKIE, USER_ID_COOKIE } from './constants';

type AuthUser = {
  id: string;
  nickname: string;
  avatar_seed?: string | null;
};

export function authSuccessResponse(user: AuthUser) {
  const response = NextResponse.json({ ok: true, user });
  response.cookies.set(NICKNAME_COOKIE, encodeURIComponent(user.nickname), COOKIE_OPTIONS);
  response.cookies.set(USER_ID_COOKIE, user.id, COOKIE_OPTIONS);
  return response;
}
