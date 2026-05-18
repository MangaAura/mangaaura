import { describe, it, expect } from 'vitest';

import { MangaTitle } from '@/core/value-objects/MangaTitle';

describe('MangaTitle Value Object', () => {
  describe('creación válida', () => {
    it('debe crear un título válido', () => {
      const title = MangaTitle.create('One Piece');
      expect(title.getValue()).toBe('One Piece');
    });

    it('debe eliminar espacios al inicio y final', () => {
      const title = MangaTitle.create('  One Piece  ');
      expect(title.getValue()).toBe('One Piece');
    });
  });

  describe('validación de títulos inválidos', () => {
    it('debe lanzar error para título vacío', () => {
      expect(() => MangaTitle.create('')).toThrow('Title cannot be empty');
    });

    it('debe lanzar error para título con solo espacios', () => {
      expect(() => MangaTitle.create('   ')).toThrow('Title cannot be empty');
    });

    it('debe lanzar error para título demasiado largo (> 200 chars)', () => {
      expect(() => MangaTitle.create('a'.repeat(201))).toThrow('Title too long');
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos títulos con mismo valor', () => {
      const t1 = MangaTitle.create('One Piece');
      const t2 = MangaTitle.create('One Piece');
      expect(t1.equals(t2)).toBe(true);
    });

    it('debe considerar diferentes dos títulos distintos', () => {
      const t1 = MangaTitle.create('One Piece');
      const t2 = MangaTitle.create('Naruto');
      expect(t1.equals(t2)).toBe(false);
    });

    it('debe considerar iguales ignorando mayúsculas', () => {
      const t1 = MangaTitle.create('one piece');
      const t2 = MangaTitle.create('One Piece');
      expect(t1.equals(t2)).toBe(true);
    });
  });
});
