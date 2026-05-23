import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthErrorMessage, getRegisterApiErrorMessage } from '@/lib/auth-errors';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock i18n `t` function that returns the key itself when no
 * translation exists (mimics how i18n libraries behave for missing keys).
 * Provide known translations via the map.
 */
function mockT(translations: Record<string, string> = {}): (key: string) => string {
  return vi.fn((key: string) => {
    if (key in translations) return translations[key];
    return key; // fallback: return the key itself (no translation)
  });
}

// ---------------------------------------------------------------------------
// getAuthErrorMessage
// ---------------------------------------------------------------------------

describe('getAuthErrorMessage', () => {
  // ── Known error codes (with translations) ────────────────────────
  describe('known Auth.js v5 error codes', () => {
    const t = mockT({
      'auth.error.CredentialsSignin.title': 'Credenciales inválidas',
      'auth.error.CredentialsSignin.message': 'El email o la contraseña no son correctos.',
      'auth.error.OAuthSignin.title': 'Error de OAuth',
      'auth.error.OAuthSignin.message': 'Error al iniciar sesión con el proveedor.',
      'auth.error.EmailSignin.title': 'Error de email',
      'auth.error.EmailSignin.message': 'No se pudo enviar el email de inicio de sesión.',
      'auth.error.default.title': 'Error de autenticación',
      'auth.error.default.message': 'Ocurrió un error inesperado.',
      'auth.error.Configuration.title': 'Error de configuración',
      'auth.error.Configuration.message': 'El servidor no está configurado correctamente.',
    });

    it('returns translated title and message for CredentialsSignin', () => {
      const result = getAuthErrorMessage('CredentialsSignin', t);
      expect(result.title).toBe('Credenciales inválidas');
      expect(result.message).toBe('El email o la contraseña no son correctos.');
    });

    it('returns "error" severity for CredentialsSignin', () => {
      const result = getAuthErrorMessage('CredentialsSignin', t);
      expect(result.severity).toBe('error');
    });

    it('returns translated title and message for OAuthSignin', () => {
      const result = getAuthErrorMessage('OAuthSignin', t);
      expect(result.title).toBe('Error de OAuth');
      expect(result.message).toBe('Error al iniciar sesión con el proveedor.');
    });

    it('returns translated title and message for EmailSignin', () => {
      const result = getAuthErrorMessage('EmailSignin', t);
      expect(result.title).toBe('Error de email');
      expect(result.message).toBe('No se pudo enviar el email de inicio de sesión.');
    });

    it('returns translated title and message for Configuration', () => {
      const result = getAuthErrorMessage('Configuration', t);
      expect(result.title).toBe('Error de configuración');
      expect(result.message).toBe('El servidor no está configurado correctamente.');
    });
  });

  // ── Warning codes ─────────────────────────────────────────────────
  describe('warning severity for non-blocking codes', () => {
    const t = mockT({
      'auth.error.OAuthCreateAccount.title': 'Cuenta no vinculada',
      'auth.error.OAuthCreateAccount.message': 'No hay cuenta vinculada con este proveedor.',
      'auth.error.OAuthAccountNotLinked.title': 'Cuenta no vinculada',
      'auth.error.OAuthAccountNotLinked.message': 'Esta cuenta de OAuth no está vinculada a un usuario.',
      'auth.error.SessionRequired.title': 'Sesión requerida',
      'auth.error.SessionRequired.message': 'Debes iniciar sesión para acceder.',
      'auth.error.Verification.title': 'Verificación pendiente',
      'auth.error.Verification.message': 'Revisa tu email para verificar tu cuenta.',
      'auth.error.AccessDenied.title': 'Acceso denegado',
      'auth.error.AccessDenied.message': 'No tienes permiso para acceder.',
      'auth.error.default.title': 'Error',
      'auth.error.default.message': 'Error por defecto',
    });

    const warningCodes = [
      'OAuthCreateAccount',
      'OAuthAccountNotLinked',
      'SessionRequired',
      'Verification',
      'AccessDenied',
    ];

    it.each(warningCodes)('%s returns "warning" severity', (code) => {
      const result = getAuthErrorMessage(code, t);
      expect(result.severity).toBe('warning');
    });
  });

  // ── Case-insensitive matching ─────────────────────────────────────
  describe('case-insensitive matching', () => {
    it('matches when input is already lowercase', () => {
      const t = mockT({
        'auth.error.default.title': 'Error',
        'auth.error.default.message': 'Default error',
        'auth.error.credentialssignin.title': 'Credenciales inválidas (lower)',
        'auth.error.credentialssignin.message': 'Mensaje lowercase.',
      });
      const result = getAuthErrorMessage('credentialssignin', t);
      expect(result.title).toBe('Credenciales inválidas (lower)');
      expect(result.message).toBe('Mensaje lowercase.');
    });

    it('prefers exact case match over normalized lowercase', () => {
      const t = mockT({
        'auth.error.CREDENTIALSSIGNIN.title': 'UPPERCASE TITLE',
        'auth.error.CREDENTIALSSIGNIN.message': 'UPPERCASE MESSAGE',
        'auth.error.credentialssignin.title': 'lowercase title',
        'auth.error.credentialssignin.message': 'lowercase message',
        'auth.error.default.title': 'Default',
        'auth.error.default.message': 'Default',
      });

      // 'CREDENTIALSSIGNIN' should match the exact-case keys first
      const result = getAuthErrorMessage('CREDENTIALSSIGNIN', t);
      expect(result.title).toBe('UPPERCASE TITLE');
    });

    it('falls back to normalized lowercase when exact case has no translation', () => {
      // Only the lowercase version has a translation — NOT the PascalCase version
      const t = mockT({
        'auth.error.credentialssignin.title': 'Lowercase fallback title',
        'auth.error.credentialssignin.message': 'Lowercase fallback message',
        'auth.error.default.title': 'Default',
        'auth.error.default.message': 'Default',
        // No 'auth.error.CredentialsSignin.title' key
      });

      const result = getAuthErrorMessage('CredentialsSignin', t);
      expect(result.title).toBe('Lowercase fallback title');
      expect(result.message).toBe('Lowercase fallback message');
    });
  });

  // ── Fallback for unknown codes ─────────────────────────────────────
  describe('fallback for unknown codes', () => {
    const t = mockT({
      'auth.error.default.title': 'Error de autenticación',
      'auth.error.default.message': 'Ocurrió un error inesperado.',
    });

    it('returns default title/message for unknown error codes', () => {
      const result = getAuthErrorMessage('SomeUnknownError', t);
      expect(result.title).toBe('Error de autenticación');
      expect(result.message).toBe('Ocurrió un error inesperado.');
    });

    it('returns "error" severity for unknown codes', () => {
      const result = getAuthErrorMessage('UnknownCode', t);
      expect(result.severity).toBe('error');
    });

    it('returns default for empty string', () => {
      const result = getAuthErrorMessage('', t);
      expect(result.title).toBe('Error de autenticación');
      expect(result.message).toBe('Ocurrió un error inesperado.');
    });
  });

  // ── Human-readable fallback ────────────────────────────────────────
  describe('human-readable message fallback', () => {
    const t = mockT({
      'auth.error.default.title': 'Error de autenticación',
      'auth.error.default.message': 'Ocurrió un error inesperado.',
    });

    it('uses the error string as message when it is long and contains spaces', () => {
      const longMessage = 'There was a problem connecting to the authentication service';
      const result = getAuthErrorMessage(longMessage, t);
      expect(result.title).toBe('Error de autenticación');
      expect(result.message).toBe(longMessage);
    });

    it('does NOT use short codes as the message (falls back to default)', () => {
      const result = getAuthErrorMessage('ABC', t);
      expect(result.message).toBe('Ocurrió un error inesperado.');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────
  describe('edge cases', () => {
    const t = mockT({});

    it('handles very long error codes gracefully', () => {
      const result = getAuthErrorMessage('X'.repeat(200), t);
      expect(result.title).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.severity).toBe('error');
    });

    it('handles codes with special characters', () => {
      const result = getAuthErrorMessage('error::with::colons', t);
      expect(result.title).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('returns consistent shape for any input', () => {
      const inputs = [
        'CredentialsSignin',
        '',
        'Some error with spaces in it that is long enough',
        'Short',
        'UPPERCASE',
      ];

      for (const input of inputs) {
        const result = getAuthErrorMessage(input, t);
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('severity');
        expect(['error', 'warning']).toContain(result.severity);
        expect(typeof result.title).toBe('string');
        expect(typeof result.message).toBe('string');
      }
    });
  });
});

// ---------------------------------------------------------------------------
// getRegisterApiErrorMessage
// ---------------------------------------------------------------------------

describe('getRegisterApiErrorMessage', () => {
  // ── Known patterns ─────────────────────────────────────────────────
  describe('known register API error patterns', () => {
    const t = mockT({
      'errors.emailExists': 'Este email ya está registrado.',
      'errors.usernameExists': 'Este nombre de usuario no está disponible.',
      'errors.weakPassword': 'La contraseña es demasiado débil.',
      'errors.rateLimitExceeded': 'Demasiadas solicitudes. Intenta más tarde.',
      'errors.createAccount': 'Error al crear la cuenta',
      'errors.generic': 'Error genérico',
    });

    it('detects "email already exists" pattern', () => {
      const result = getRegisterApiErrorMessage('Email already exists', t);
      expect(result.title).toBe('Error al crear la cuenta');
      expect(result.message).toBe('Este email ya está registrado.');
      expect(result.severity).toBe('warning');
    });

    it('detects "username already exists" pattern', () => {
      const result = getRegisterApiErrorMessage('Username already exists in database', t);
      expect(result.title).toBe('Error al crear la cuenta');
      expect(result.message).toBe('Este nombre de usuario no está disponible.');
      expect(result.severity).toBe('warning');
    });

    it('detects "weak password" pattern', () => {
      const result = getRegisterApiErrorMessage('Weak password provided', t);
      expect(result.title).toBe('Error al crear la cuenta');
      expect(result.message).toBe('La contraseña es demasiado débil.');
      expect(result.severity).toBe('warning');
    });

    it('detects "rate limit" pattern', () => {
      const result = getRegisterApiErrorMessage('Rate limit exceeded. Try again later.', t);
      expect(result.title).toBe('Error al crear la cuenta');
      expect(result.message).toBe('Demasiadas solicitudes. Intenta más tarde.');
      expect(result.severity).toBe('warning');
    });
  });

  // ── Case-insensitive matching ─────────────────────────────────────
  describe('case-insensitive pattern matching', () => {
    const t = mockT({
      'errors.emailExists': 'Email ya registrado.',
      'errors.createAccount': 'Error al crear cuenta',
      'errors.generic': 'Error genérico',
    });

    it('matches EMAIL ALREADY EXISTS in uppercase', () => {
      const result = getRegisterApiErrorMessage('EMAIL ALREADY EXISTS', t);
      expect(result.message).toBe('Email ya registrado.');
    });

    it('matches Email Already Exists in mixed case', () => {
      const result = getRegisterApiErrorMessage('Email Already Exists', t);
      expect(result.message).toBe('Email ya registrado.');
    });
  });

  // ── Partial matching ──────────────────────────────────────────────
  describe('partial substring matching', () => {
    const t = mockT({
      'errors.emailExists': 'Email duplicado.',
      'errors.createAccount': 'Error al crear cuenta',
      'errors.generic': 'Error genérico',
    });

    it('detects pattern embedded in longer message', () => {
      const result = getRegisterApiErrorMessage(
        'Database error: email already exists in the users table.',
        t,
      );
      expect(result.message).toBe('Email duplicado.');
    });

    it('matches only the first known pattern found', () => {
      const result = getRegisterApiErrorMessage(
        'email already exists and username already exists',
        t,
      );
      // Should match "email already exists" first (it's first in the map)
      expect(result.message).toBe('Email duplicado.');
    });
  });

  // ── Fallback for unknown messages ─────────────────────────────────
  describe('fallback for unknown error messages', () => {
    it('shows the original error message as the message text', () => {
      const t = mockT({
        'errors.createAccount': 'Error al crear la cuenta',
        'errors.generic': 'Error genérico',
      });
      const result = getRegisterApiErrorMessage('Something went terribly wrong', t);
      expect(result.title).toBe('Error al crear la cuenta');
      expect(result.message).toBe('Something went terribly wrong');
      expect(result.severity).toBe('error');
    });

    it('falls back to generic error when message is empty', () => {
      const t = mockT({
        'errors.createAccount': 'Error al crear la cuenta',
        'errors.generic': 'Algo salió mal.',
      });
      const result = getRegisterApiErrorMessage('', t);
      expect(result.title).toBe('Error al crear la cuenta');
      expect(result.message).toBe('Algo salió mal.');
      expect(result.severity).toBe('error');
    });
  });

  // ── Translation missing ───────────────────────────────────────────
  describe('when i18n translation is missing', () => {
    it('falls back to original error message when i18n key is not translated', () => {
      const t = mockT({
        'errors.createAccount': 'Error al crear la cuenta',
        'errors.generic': 'Error genérico',
        // No errors.emailExists translation — key will return itself
      });
      const result = getRegisterApiErrorMessage('Email already exists', t);
      // Since errors.emailExists has no translation, the function should
      // continue to the fallback (the `if (translated !== ...)` guard)
      expect(result.message).toBe('Email already exists');
      expect(result.severity).toBe('error');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles null-like strings gracefully', () => {
      const t = mockT({
        'errors.createAccount': 'Error al crear cuenta',
        'errors.generic': 'Error genérico',
      });
      // 'null' as a literal string
      const result = getRegisterApiErrorMessage('null', t);
      expect(result.title).toBe('Error al crear cuenta');
      expect(result.message).toBe('null');
      expect(result.severity).toBe('error');
    });

    it('returns consistent shape for any input', () => {
      const t = mockT({});
      const inputs = [
        'Email already exists',
        'Username already exists',
        '',
        'Some random database error',
        'RATE LIMIT EXCEEDED',
      ];

      for (const input of inputs) {
        const result = getRegisterApiErrorMessage(input, t);
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('severity');
        expect(['error', 'warning']).toContain(result.severity);
        expect(typeof result.title).toBe('string');
        expect(typeof result.message).toBe('string');
      }
    });
  });
});
