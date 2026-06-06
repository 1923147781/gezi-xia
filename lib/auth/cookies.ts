import { NICKNAME_COOKIE, USER_ID_COOKIE } from './constants';

export function decodeCookieValue(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw).trim();
    return value || null;
  } catch {
    const value = raw.trim();
    return value || null;
  }
}

export function getNicknameFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${NICKNAME_COOKIE}=([^;]*)`));
  return decodeCookieValue(match?.[1]);
}

export function readClientNickname(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${NICKNAME_COOKIE}=([^;]*)`));
  return decodeCookieValue(match?.[1]);
}

export function readClientUserId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${USER_ID_COOKIE}=([^;]*)`));
  return decodeCookieValue(match?.[1]);
}

export function clearClientAuthStorage() {
  if (typeof document === 'undefined') return;
  localStorage.removeItem(NICKNAME_COOKIE);
  localStorage.removeItem(USER_ID_COOKIE);
}

export function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
