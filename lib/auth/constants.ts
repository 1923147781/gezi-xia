export const NICKNAME_COOKIE = 'gezi-nickname';
export const USER_ID_COOKIE = 'gezi-user-id';

export const PROTECTED_PREFIXES = ['/dashboard', '/groups', '/settings', '/invites'] as const;

export const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax' as const,
};
