import { describe, it, expect } from 'vitest';

import { Slug, InvalidSlugError } from '@/core/value-objects/Slug';

describe('Slug Value Object', () => {
  describe('creación con create()', () => {
    it('debe crear un slug válido', () => {
      const slug = Slug.create('my-slug');
      expect(slug.value).toBe('my-slug');
    });

    it('debe normalizar a minúsculas', () => {
      const slug = Slug.create('My-Slug');
      expect(slug.value).toBe('my-slug');
    });

    it('debe eliminar caracteres no válidos', () => {
      const slug = Slug.create('hello world!@#');
      expect(slug.value).toBe('helloworld');
    });

    it('debe eliminar espacios', () => {
      const slug = Slug.create('  my-slug  ');
      expect(slug.value).toBe('my-slug');
    });

    it('debe colapsar guiones múltiples', () => {
      const slug = Slug.create('my---slug');
      expect(slug.value).toBe('my-slug');
    });
  });

  describe('creación con fromTitle()', () => {
    it('debe crear slug a partir de un título simple', () => {
      const slug = Slug.fromTitle('My Great Title');
      expect(slug.value).toBe('my-great-title');
    });

    it('debe crear slug a partir de título con caracteres especiales', () => {
      const slug = Slug.fromTitle('Hello World!!!');
      expect(slug.value).toBe('hello-world');
    });

    it('debe colapsar espacios múltiples', () => {
      const slug = Slug.fromTitle('One   Two');
      expect(slug.value).toBe('one-two');
    });
  });

  describe('validación de slugs inválidos', () => {
    it('debe lanzar error para entrada vacía', () => {
      expect(() => Slug.create('')).toThrow(InvalidSlugError);
    });

    it('debe lanzar error para entrada con solo caracteres no válidos', () => {
      expect(() => Slug.create('!@#$%')).toThrow(InvalidSlugError);
    });

    it('debe lanzar error para slug demasiado largo (> 100 chars)', () => {
      expect(() => Slug.create('a'.repeat(101))).toThrow(InvalidSlugError);
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos slugs con mismo valor', () => {
      const s1 = Slug.create('my-slug');
      const s2 = Slug.create('my-slug');
      expect(s1.equals(s2)).toBe(true);
    });

    it('debe considerar diferentes dos slugs distintos', () => {
      const s1 = Slug.create('slug-one');
      const s2 = Slug.create('slug-two');
      expect(s1.equals(s2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('debe retornar el valor del slug', () => {
      const slug = Slug.create('my-slug');
      expect(slug.toString()).toBe('my-slug');
    });
  });
});
