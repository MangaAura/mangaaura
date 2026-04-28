import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_SECRET_NAME = 'csrf_secret';
const TOKEN_LENGTH = 32;

/**
 * Generate a random CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Set CSRF token in cookies
 */
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value ?? null;
}

/**
 * Validate CSRF token from request
 * Expected to be sent in header: X-CSRF-Token
 */
export async function validateCSRFToken(request: Request): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }

  // Skip for webhook endpoints
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/webhooks/')) {
    return { valid: true };
  }

  // Get token from header
  const token = request.headers.get('X-CSRF-Token');
  if (!token) {
    return { valid: false, error: 'CSRF token missing' };
  }

  // Get token from cookie
  const cookieToken = await getCSRFToken();
  if (!cookieToken) {
    return { valid: false, error: 'CSRF cookie missing' };
  }

  // Compare tokens using timing-safe comparison
  try {
    const tokenBuffer = Buffer.from(token);
    const cookieBuffer = Buffer.from(cookieToken);
    
    if (tokenBuffer.length !== cookieBuffer.length) {
      return { valid: false, error: 'CSRF token mismatch' };
    }
    
    const match = crypto.timingSafeEqual(tokenBuffer, cookieBuffer);
    
    if (!match) {
      return { valid: false, error: 'CSRF token invalid' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'CSRF validation error' };
  }
}

/**
 * Rotate CSRF token (call after successful authentication)
 */
export async function rotateCSRFToken(): Promise<string> {
  // Clear old token
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
  
  // Generate new token
  return setCSRFToken();
}

/**
 * Clear CSRF token (call on logout)
 */
export async function clearCSRFToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_TOKEN_NAME);
}

/**
 * Get CSRF token for client-side usage
 * Use this in API routes to send token to client
 */
export async function getCSRFTokenForClient(): Promise<string> {
  let token = await getCSRFToken();
  if (!token) {
    token = await setCSRFToken();
  }
  return token;
}
