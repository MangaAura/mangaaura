/**
 * Shared auth error message utility.
 *
 * Maps Auth.js v5 error codes (and custom application error codes)
 * to translated user-facing messages via the i18n `t` function.
 *
 * Used by both /auth/login and /auth/register pages.
 */

export interface AuthErrorMessage {
  title: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Error codes that should be shown as a warning (non-blocking) rather than error.
 */
const WARNING_CODES = new Set([
  'OAuthCreateAccount',
  'OAuthAccountNotLinked',
  'SessionRequired',
  'Verification',
  'AccessDenied',
]);

/**
 * Map NextAuth v5 SignInResponse.error codes and custom app errors
 * to translated messages via i18n keys `auth.error.<code>.title` / `.message`.
 *
 * Falls back to `auth.error.default` for unknown codes.
 */
export function getAuthErrorMessage(
  errorCode: string,
  t: (key: string) => string,
): AuthErrorMessage {
  // Normalize: lowercase for case-insensitive matching
  const normalized = errorCode.toLowerCase();

  // Try exact match first (preserving original casing for i18n keys)
  const titleKey = `auth.error.${errorCode}.title`;
  const messageKey = `auth.error.${errorCode}.message`;
  const title = t(titleKey);
  const message = t(messageKey);

  // If translation exists (returns something other than the key itself), use it
  if (title !== titleKey) {
    return {
      title,
      message,
      severity: WARNING_CODES.has(errorCode) ? 'warning' : 'error',
    };
  }

  // Try lowercase normalized version
  const normalizedTitleKey = `auth.error.${normalized}.title`;
  const normalizedMessageKey = `auth.error.${normalized}.message`;
  const normalizedTitle = t(normalizedTitleKey);
  const normalizedMessage = t(normalizedMessageKey);

  if (normalizedTitle !== normalizedTitleKey) {
    return {
      title: normalizedTitle,
      message: normalizedMessage,
      severity: 'error',
    };
  }

  // Fallback: use error message directly if it looks like a user-readable message
  if (errorCode.length > 10 && errorCode.includes(' ')) {
    return {
      title: t('auth.error.default.title'),
      message: errorCode,
      severity: 'error',
    };
  }

  // Default fallback
  return {
    title: t('auth.error.default.title'),
    message: t('auth.error.default.message'),
    severity: 'error',
  };
}

/**
 * Map API error messages from the register endpoint to i18n keys.
 */
export function getRegisterApiErrorMessage(
  errorMessage: string,
  t: (key: string) => string,
): AuthErrorMessage {
  // Common register API errors -> i18n keys
  const messageMap: Record<string, string> = {
    'email already exists': 'emailExists',
    'username already exists': 'usernameExists',
    'weak password': 'weakPassword',
    'rate limit': 'rateLimitExceeded',
  };

  // Check for known patterns
  const lower = errorMessage.toLowerCase();
  for (const [pattern, i18nKey] of Object.entries(messageMap)) {
    if (lower.includes(pattern)) {
      const translated = t(`errors.${i18nKey}`);
      if (translated !== `errors.${i18nKey}`) {
        return {
          title: t('errors.createAccount'),
          message: translated,
          severity: 'warning',
        };
      }
    }
  }

  // Fallback: show the original error message
  return {
    title: t('errors.createAccount'),
    message: errorMessage || t('errors.generic'),
    severity: 'error',
  };
}
