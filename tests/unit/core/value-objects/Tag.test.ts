import { describe, it, expect } from 'vitest';
import { Tag } from '@/core/value-objects/Tag';

describe('Tag Value Object', () => {
  describe('creación válida', () => {
    it('debe crear un tag válido', () => {
      const tag = Tag.create('shonen');
      expect(tag.getValue()).toBe('shonen');
    });

    it('debe normalizar a minúsculas', () => {
      const tag = Tag.create('Shonen');
      expect(tag.getValue()).toBe('shonen');
    });

    it('debe eliminar espacios', () => {
      const tag = Tag.create('  shonen  ');
      expect(tag.getValue()).toBe('shonen');
    });

    it('debe permitir guiones', () => {
      const tag = Tag.create('slice-of-life');
      expect(tag.getValue()).toBe('slice-of-life');
    });
  });

  describe('validación de tags inválidos', () => {
    it('debe lanzar error para tag vacío', () => {
      expect(() => Tag.create('')).toThrow('Tag cannot be empty');
    });

    it('debe lanzar error para tag con solo espacios', () => {
      expect(() => Tag.create('   ')).toThrow('Tag cannot be empty');
    });

    it('debe lanzar error para tag con caracteres inválidos', () => {
      expect(() => Tag.create('tag one')).toThrow('Tag can only contain letters, numbers and hyphens');
    });

    it('debe lanzar error para tag con caracteres especiales', () => {
      expect(() => Tag.create('shonen!')).toThrow('Tag can only contain letters, numbers and hyphens');
    });

    it('debe lanzar error para tag demasiado largo (> 50 chars)', () => {
      expect(() => Tag.create('a'.repeat(51))).toThrow('Tag too long');
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos tags con mismo valor', () => {
      const t1 = Tag.create('shonen');
      const t2 = Tag.create('shonen');
      expect(t1.equals(t2)).toBe(true);
    });

    it('debe considerar diferentes dos tags distintos', () => {
      const t1 = Tag.create('shonen');
      const t2 = Tag.create('seinen');
      expect(t1.equals(t2)).toBe(false);
    });

    it('debe considerar iguales ignorando mayúsculas', () => {
      const t1 = Tag.create('Shonen');
      const t2 = Tag.create('SHONEN');
      expect(t1.equals(t2)).toBe(true);
    });
  });
});
