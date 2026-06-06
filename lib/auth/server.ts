import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decodeCookieValue } from './cookies';
import { NICKNAME_COOKIE, USER_ID_COOKIE } from './constants';

export type AuthUser = {
  id: string;
  nickname: string;
  avatar_seed: string | null;
};

export async function getSessionNickname(): Promise<string | null> {
  const cookieStore = await cookies();
  return decodeCookieValue(cookieStore.get(NICKNAME_COOKIE)?.value);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return decodeCookieValue(cookieStore.get(USER_ID_COOKIE)?.value);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const nickname = await getSessionNickname();
  if (!nickname) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from('users').select('id, nickname, avatar_seed').eq('nickname', nickname).maybeSingle();
  return data ?? null;
}
