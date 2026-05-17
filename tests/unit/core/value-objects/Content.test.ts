import { describe, it, expect } from 'vitest';
import { Content } from '@/core/value-objects/Content';

describe('Content Value Object', () => {
  describe('creación válida', () => {
    it('debe crear un contenido válido', () => {
      const content = Content.create('Este es el contenido del capítulo');
      expect(content.getValue()).toBe('Este es el contenido del capítulo');
    });

    it('debe eliminar espacios al inicio y final', () => {
      const content = Content.create('  Contenido con espacios  ');
      expect(content.getValue()).toBe('Contenido con espacios');
    });
  });

  describe('validación de contenidos inválidos', () => {
    it('debe lanzar error para contenido vacío', () => {
      expect(() => Content.create('')).toThrow('Content cannot be empty');
    });

    it('debe lanzar error para contenido con solo espacios', () => {
      expect(() => Content.create('   ')).toThrow('Content cannot be empty');
    });

    it('debe lanzar error para contenido demasiado largo (> 10000 chars)', () => {
      expect(() => Content.create('a'.repeat(10001))).toThrow('Content too long');
    });

    it('debe permitir contenido de exactamente 10000 caracteres', () => {
      const content = Content.create('a'.repeat(10000));
      expect(content.getValue()).toBe('a'.repeat(10000));
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos contenidos con mismo valor', () => {
      const c1 = Content.create('Same content');
      const c2 = Content.create('Same content');
      expect(c1.equals(c2)).toBe(true);
    });

    it('debe considerar diferentes dos contenidos distintos', () => {
      const c1 = Content.create('Content one');
      const c2 = Content.create('Content two');
      expect(c1.equals(c2)).toBe(false);
    });
  });
});
