import { describe, it, expect } from 'vitest';

import { Email, InvalidEmailError } from '@/core/value-objects/Email';

describe('Email Value Object', () => {
  describe('creación válida', () => {
    it('debe crear un email válido', () => {
      const email = Email.create('usuario@ejemplo.com');
      expect(email.value).toBe('usuario@ejemplo.com');
    });

    it('debe convertir a minúsculas', () => {
      const email = Email.create('USUARIO@EJEMPLO.COM');
      expect(email.value).toBe('usuario@ejemplo.com');
    });

    it('debe eliminar espacios', () => {
      const email = Email.create('  usuario@ejemplo.com  ');
      expect(email.value).toBe('usuario@ejemplo.com');
    });

    it('debe extraer el dominio correctamente', () => {
      const email = Email.create('usuario@ejemplo.com');
      expect(email.domain).toBe('ejemplo.com');
    });
  });

  describe('validación de emails inválidos', () => {
    it('debe lanzar error para email sin @', () => {
      expect(() => Email.create('usuarioejemplo.com')).toThrow(InvalidEmailError);
    });

    it('debe lanzar error para email sin dominio', () => {
      expect(() => Email.create('usuario@')).toThrow(InvalidEmailError);
    });

    it('debe lanzar error para email sin usuario', () => {
      expect(() => Email.create('@ejemplo.com')).toThrow(InvalidEmailError);
    });

    it('debe lanzar error para email con espacios intermedios', () => {
      expect(() => Email.create('usuario @ ejemplo.com')).toThrow(InvalidEmailError);
    });

    it('debe lanzar error para email demasiado largo (>254 chars)', () => {
      const longEmail = 'a'.repeat(250) + '@ejemplo.com';
      expect(() => Email.create(longEmail)).toThrow(InvalidEmailError);
    });
  });

  describe('createOrNull', () => {
    it('debe retornar email para entrada válida', () => {
      const email = Email.createOrNull('test@test.com');
      expect(email).not.toBeNull();
      expect(email?.value).toBe('test@test.com');
    });

    it('debe retornar null para entrada inválida', () => {
      const email = Email.createOrNull('invalid');
      expect(email).toBeNull();
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos emails con mismo valor', () => {
      const email1 = Email.create('test@test.com');
      const email2 = Email.create('test@test.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('debe considerar diferentes dos emails distintos', () => {
      const email1 = Email.create('test1@test.com');
      const email2 = Email.create('test2@test.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('debe considerar iguales ignorando mayúsculas', () => {
      const email1 = Email.create('TEST@test.com');
      const email2 = Email.create('test@test.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('debe retornar el valor del email', () => {
      const email = Email.create('test@test.com');
      expect(email.toString()).toBe('test@test.com');
    });
  });
});
