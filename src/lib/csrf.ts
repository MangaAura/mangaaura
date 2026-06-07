/**
 * CSRF Protection — Client-side fetch interceptor
 *
 * Reads the JS-accessible CSRF cookie (`__csrf_mw_js`) set by the proxy
 * and automatically adds it as the `x-csrf-token` header on mutating
 * fetch requests (POST, PUT, PATCH, DELETE) to same-origin API routes.
 *
 * Call `initCSRFProtection()` once at app startup (e.g. in Providers.tsx).
 */

const CSRF_COOKIE_NAME = '__csrf_mw_js';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Read the CSRF token from the non-httpOnly cookie.
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(CSRF_COOKIE_NAME + '=')) {
      return trimmed.slice(CSRF_COOKIE_NAME.length + 1);
    }
  }
  return null;
}

/**
 * Check if a string is a same-origin URL (relative or matching origin).
 */
function isSameOrigin(url: string | URL | Request): boolean {
  if (typeof url === 'string') {
    // Relative URLs are always same-origin
    if (url.startsWith('/')) return true;
    try {
      const parsed = new URL(url);
      return parsed.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  if (url instanceof URL) {
    return url.origin === window.location.origin;
  }
  if (url instanceof Request) {
    return isSameOrigin(url.url);
  }
  return false;
}

/**
 * Check if a path is an API route that needs CSRF protection.
 */
function isAPIRoute(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const path = url.startsWith('/') ? url : new URL(url).pathname;
  return path.startsWith('/api/');
}

/**
 * Check if a method is mutating (needs CSRF protection).
 */
function isMutatingMethod(init?: RequestInit): boolean {
  const method = (init?.method || 'GET').toUpperCase();
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

/**
 * Initialize the global fetch interceptor.
 *
 * Monkey-patches `window.fetch` to automatically add the CSRF token
 * header for same-origin, mutating API requests.
 *
 * Safe to call multiple times — re-patches each time with the current
 * native fetch reference.
 */
export function initCSRFProtection(): void {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = function csrfFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    // Only intercept same-origin, mutating API requests
    if (isSameOrigin(input) && isAPIRoute(input) && isMutatingMethod(init)) {
      const token = getCSRFToken();
      if (token) {
        // Merge with existing headers
        const headers = init?.headers ?? {};
        if (headers instanceof Headers) {
          if (!headers.has(CSRF_HEADER_NAME)) {
            headers.set(CSRF_HEADER_NAME, token);
          }
        } else if (Array.isArray(headers)) {
          const hasHeader = headers.some(([name]) => name.toLowerCase() === CSRF_HEADER_NAME);
          if (!hasHeader) {
            headers.push([CSRF_HEADER_NAME, token]);
          }
        } else {
          // Plain object
          (headers as Record<string, string>)[CSRF_HEADER_NAME] = token;
        }
        init = { ...init, headers };
      }
    }

    return originalFetch(input, init);
  };
}
