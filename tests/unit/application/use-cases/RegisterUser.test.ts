import { describe, it, expect } from 'vitest';

import { User } from '@/core/entities/User';
import { Email } from '@/core/value-objects/Email';
import { Password } from '@/core/value-objects/Password';

describe('RegisterUser Use Case', () => {
  describe('registro con email y contraseña', () => {
    it('debe registrar usuario con datos válidos', () => {
      const email = Email.create('newuser@test.com');
      const password = Password.createFromPlain('SecurePass123!');

      const { user } = User.registerWithEmail(email, 'newuser', password);

      expect(user.email.value).toBe('newuser@test.com');
      expect(user.username).toBe('newuser');
      expect(user.passwordHash).toBeDefined();
      expect(user.aura.amount).toBe(50); // Bonus de registro
    });

    it('debe emitir evento USER_REGISTERED', () => {
      const email = Email.create('event@test.com');
      const password = Password.createFromPlain('SecurePass123!');

      const { events } = User.registerWithEmail(email, 'eventuser', password);

      const event = events.find((e) => e.type === 'USER_REGISTERED');
      expect(event).toBeDefined();
      expect(event?.payload.email).toBe('event@test.com');
      expect(event?.payload.registrationBonus).toBe(50);
    });
  });

  describe('registro con OAuth', () => {
    it('debe registrar usuario desde Google OAuth', () => {
      const email = Email.create('google@user.com');

      const { user, events } = User.registerWithOAuth(
        email,
        'googleuser',
        'google',
        'google-123'
      );

      expect(user.email.value).toBe('google@user.com');
      expect(user.emailVerified).toBeDefined(); // OAuth = verificado
      expect(user.passwordHash).toBeUndefined();

      const event = events.find((e) => e.type === 'USER_REGISTERED_OAUTH');
      expect(event?.payload.provider).toBe('google');
    });

    it('debe registrar usuario desde GitHub OAuth', () => {
      const email = Email.create('github@user.com');

      const { user } = User.registerWithOAuth(email, 'githubuser', 'github', 'github-456');

      expect(user.username).toBe('githubuser');
    });
  });
});
