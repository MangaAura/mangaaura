/**
 * OAuth Registration Token
 *
 * Creates signed JWTs to pass OAuth profile data from NextAuth's signIn callback
 * to the /auth/complete-registration page without exposing it in URLs.
 *
 * Uses jose (available as a transitive dependency via next-auth) for JWT signing.
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface OAuthRegistrationPayload {
  /** Verified email from the OAuth provider */
  email: string;
  /** Display name from OAuth provider (e.g. Google profile name) */
  name?: string | null;
  /** Avatar URL from OAuth provider */
  image?: string | null;
  /** OAuth provider name: 'google' | 'github' */
  provider: string;
  /** OAuth provider account ID */
  providerAccountId: string;
  /** Account type (usually 'oauth') */
  accountType: string;
  /** Account ID from the provider account (we use this to create the account link) */
  providerAccount?: Record<string, unknown>;
}

const TOKEN_EXPIRY = '15m';
const COOKIE_NAME = 'oauth-registration-pending';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'Missing AUTH_SECRET or NEXTAUTH_SECRET env var needed for OAuth registration tokens'
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed JWT token containing the OAuth profile data.
 */
export async function createOAuthRegistrationToken(
  payload: OAuthRegistrationPayload
): Promise<string> {
  const secret = getSecret();

  const token = await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(secret);

  return token;
}

/**
 * Verify and decode an OAuth registration token.
 * Returns null if the token is invalid or expired.
 */
export async function verifyOAuthRegistrationToken(
  token: string
): Promise<OAuthRegistrationPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as OAuthRegistrationPayload;
  } catch {
    return null;
  }
}

/**
 * Cookie options for the pending registration token.
 * Short-lived (15 min), httpOnly, sameSite lax.
 */
export function getOAuthRegistrationCookieOptions(): {
  name: string;
  options: {
    httpOnly: boolean;
    sameSite: 'lax';
    path: string;
    secure: boolean;
    maxAge: number;
  };
} {
  return {
    name: COOKIE_NAME,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60, // 15 minutes
    },
  };
}

export { COOKIE_NAME };
