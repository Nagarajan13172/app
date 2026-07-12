// Central place for backend URLs. NEXT_PUBLIC_ vars must be referenced as a
// static literal so Next inlines them into the client bundle at build time.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api';

// The backend serves uploaded files (e.g. /uploads/x.png) from its origin,
// i.e. the API base URL without the trailing /api.
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Resolve a backend-relative asset path (like "/uploads/x.png") to a full URL. */
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
