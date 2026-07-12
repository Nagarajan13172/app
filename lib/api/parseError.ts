import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiErrorBody } from '@/lib/types/api';

/**
 * Turn any RTK Query error into a single human-readable message. Accepts
 * `unknown` so it works both with a hook's `error` field and with values
 * caught from `.unwrap()`.
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error || typeof error !== 'object') return fallback;

  // FetchBaseQueryError: has a `status` field.
  if ('status' in error) {
    const e = error as FetchBaseQueryError;
    // Network / parsing failures use a string status, e.g. 'FETCH_ERROR'.
    if (typeof e.status === 'string') {
      if (e.status === 'FETCH_ERROR') {
        return 'Cannot reach the server. Is the backend running on port 3000?';
      }
      return (e as { error?: string }).error ?? fallback;
    }

    // HTTP error with a parsed JSON body from our backend.
    const body = e.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(' • ') : body.message;
    }
    return fallback;
  }

  // SerializedError (e.g. thrown in a query fn).
  const message = (error as SerializedError).message;
  return typeof message === 'string' ? message : fallback;
}
