import type { AuthUser } from '@/lib/types/api';

// The token is mirrored into a JS-readable cookie so proxy.ts (server-side) can
// do optimistic redirects, and into localStorage for the Authorization header.
// Note: like localStorage, this cookie is readable by JS and is not a substitute
// for an httpOnly session — the real guard runs client-side (see AuthGuard).
export const TOKEN_STORAGE_KEY = 'accessToken';
export const USER_STORAGE_KEY = 'authUser';
export const AUTH_COOKIE_NAME = 'token';

const COOKIE_MAX_AGE_DAYS = 1; // matches the backend JWT expiry (~24h)

const isBrowser = (): boolean => typeof window !== 'undefined';

export function readStoredToken(): string | null {
  if (!isBrowser()) return null;
  try {
    const fromStorage = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (fromStorage) return fromStorage;
  } catch {
    /* fall through to the cookie */
  }
  // Fallback: the cookie holds the same token, and may be the only copy when
  // localStorage is unavailable (e.g. private browsing).
  return readCookie(AUTH_COOKIE_NAME);
}

/** Re-set the auth cookie's expiry so it stays aligned with localStorage. */
export function refreshAuthCookie(token: string): void {
  if (!isBrowser()) return;
  setCookie(AUTH_COOKIE_NAME, token, COOKIE_MAX_AGE_DAYS);
}

export function readStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function persistAuth(token: string, user: AuthUser): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* storage may be unavailable (private mode) — the cookie is still set below */
  }
  setCookie(AUTH_COOKIE_NAME, token, COOKIE_MAX_AGE_DAYS);
}

export function clearAuth(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  deleteCookie(AUTH_COOKIE_NAME);
}

function setCookie(name: string, value: string, days: number): void {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
