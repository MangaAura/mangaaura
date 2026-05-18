import { describe, it, expect } from 'vitest';

import { Password, WeakPasswordError } from '@/core/value-objects/Password';

describe('Password Value Object', () => {
  describe('creación válida', () => {
    it('debe crear contraseña con todos los requisitos', () => {
      const password = Password.createFromPlain('SecurePass123!');
      expect(password.plainText).toBe('SecurePass123!');
      expect(password.isHashed).toBe(false);
    });
  });

  describe('validación de requisitos', () => {
    it('debe rechazar contraseña menor a 8 caracteres', () => {
      expect(() => Password.createFromPlain('Ab1!')).toThrow(WeakPasswordError);
      expect(() => Password.createFromPlain('Ab1!')).toThrow(/Mínimo 8 caracteres/);
    });

    it('debe rechazar contraseña mayor a 128 caracteres', () => {
      const longPassword = 'A1!' + 'a'.repeat(126);
      expect(() => Password.createFromPlain(longPassword)).toThrow(WeakPasswordError);
      expect(() => Password.createFromPlain(longPassword)).toThrow(/Máximo 128 caracteres/);
    });

    it('debe rechazar sin mayúscula', () => {
      expect(() => Password.createFromPlain('securepass123!')).toThrow(WeakPasswordError);
      expect(() => Password.createFromPlain('securepass123!')).toThrow(/mayúscula/);
    });

    it('debe rechazar sin minúscula', () => {
      expect(() => Password.createFromPlain('SECUREPASS123!')).toThrow(WeakPasswordError);
      expect(() => Password.createFromPlain('SECUREPASS123!')).toThrow(/minúscula/);
    });

    it('debe rechazar sin número', () => {
      expect(() => Password.createFromPlain('SecurePass!')).toThrow(WeakPasswordError);
      expect(() => Password.createFromPlain('SecurePass!')).toThrow(/número/);
    });

    it('debe rechazar sin carácter especial', () => {
      expect(() => Password.createFromPlain('SecurePass123')).toThrow(WeakPasswordError);
      expect(() => Password.createFromPlain('SecurePass123')).toThrow(/carácter especial/);
    });
  });

  describe('creación desde hash', () => {
    it('debe crear contraseña hasheada sin validar', () => {
      const hash = '$2b$10$...hash...';
      const password = Password.createFromHash(hash);
      expect(password.hash).toBe(hash);
      expect(password.isHashed).toBe(true);
      expect(password.plainText).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('debe ocultar texto plano', () => {
      const password = Password.createFromPlain('SecurePass123!');
      expect(password.toString()).toBe('[PLAIN_TEXT_HIDDEN]');
    });

    it('debe mostrar hash si está hasheada', () => {
      const hash = '$2b$10$...hash...';
      const password = Password.createFromHash(hash);
      expect(password.toString()).toBe(hash);
    });
  });
});
