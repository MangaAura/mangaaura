import { describe, it, expect } from 'vitest';
import { Username, InvalidUsernameError } from '@/core/value-objects/Username';

describe('Username Value Object', () => {
  describe('creación válida', () => {
    it('debe crear un username válido', () => {
      const username = Username.create('john_doe');
      expect(username.value).toBe('john_doe');
    });

    it('debe normalizar a minúsculas', () => {
      const username = Username.create('John_Doe');
      expect(username.value).toBe('john_doe');
    });

    it('debe eliminar espacios', () => {
      const username = Username.create('  user_1  ');
      expect(username.value).toBe('user_1');
    });

    it('debe retornar displayValue', () => {
      const username = Username.create('test_user');
      expect(username.displayValue).toBe('test_user');
    });
  });

  describe('validación de usernames inválidos', () => {
    it('debe lanzar error para username vacío', () => {
      expect(() => Username.create('')).toThrow(InvalidUsernameError);
    });

    it('debe lanzar error para username muy corto (< 3 chars)', () => {
      expect(() => Username.create('ab')).toThrow(InvalidUsernameError);
    });

    it('debe lanzar error para username muy largo (> 30 chars)', () => {
      expect(() => Username.create('a'.repeat(31))).toThrow(InvalidUsernameError);
    });

    it('debe lanzar error para username con caracteres inválidos', () => {
      expect(() => Username.create('user name')).toThrow(InvalidUsernameError);
    });

    it('debe lanzar error para username con caracteres especiales', () => {
      expect(() => Username.create('user@name')).toThrow(InvalidUsernameError);
    });

    it('debe lanzar error para username solo con espacios', () => {
      expect(() => Username.create('   ')).toThrow(InvalidUsernameError);
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos usernames con mismo valor', () => {
      const u1 = Username.create('test_user');
      const u2 = Username.create('test_user');
      expect(u1.equals(u2)).toBe(true);
    });

    it('debe considerar diferentes dos usernames distintos', () => {
      const u1 = Username.create('user_one');
      const u2 = Username.create('user_two');
      expect(u1.equals(u2)).toBe(false);
    });

    it('debe considerar iguales ignorando mayúsculas', () => {
      const u1 = Username.create('User_Name');
      const u2 = Username.create('user_name');
      expect(u1.equals(u2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('debe retornar el valor del username', () => {
      const username = Username.create('test_user');
      expect(username.toString()).toBe('test_user');
    });
  });
});
