import { describe, it, expect } from 'vitest';
import { Email } from '@/core/value-objects/Email';
import { Password } from '@/core/value-objects/Password';
import { User } from '@/core/entities/User';

describe('Auth API Integration', () => {
  describe('registro de usuario', () => {
    it('debe crear usuario con email y contraseña válidos', () => {
      const email = Email.create('test@example.com');
      const password = Password.createFromPlain('SecurePass123!');

      const { user, events } = User.registerWithEmail(email, 'testuser', password);

      expect(user.email.value).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.inkcoins.amount).toBe(50);

      const event = events.find((e) => e.type === 'USER_REGISTERED');
      expect(event).toBeDefined();
      expect(event?.payload.registrationBonus).toBe(50);
    });

    it('debe rechazar email inválido', () => {
      expect(() => Email.create('invalid')).toThrow();
    });

    it('debe rechazar contraseña débil', () => {
      expect(() => Password.createFromPlain('weak')).toThrow();
    });
  });

  describe('OAuth registro', () => {
    it('debe crear usuario desde OAuth con email verificado', () => {
      const email = Email.create('oauth@google.com');

      const { user, events } = User.registerWithOAuth(
        email,
        'oauthuser',
        'google',
        'google-123'
      );

      expect(user.emailVerified).toBeDefined();
      expect(user.passwordHash).toBeUndefined();

      const event = events.find((e) => e.type === 'USER_REGISTERED_OAUTH');
      expect(event?.payload.provider).toBe('google');
    });
  });

  describe('login', () => {
    it('debe verificar contraseña hasheada', async () => {
      // Simulación de verificación bcrypt
      const plainPassword = 'SecurePass123!';
      const hashedPassword = await import('bcryptjs').then((bcrypt) =>
        bcrypt.hash(plainPassword, 12)
      );

      // Simular verificación
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);

      expect(isValid).toBe(true);
    });

    it('debe rechazar contraseña incorrecta', async () => {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('correct', 12);
      const isValid = await bcrypt.compare('wrong', hashedPassword);

      expect(isValid).toBe(false);
    });
  });
});
