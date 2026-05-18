import { describe, it, expect } from 'vitest';
import { Url } from '@/core/value-objects/Url';

describe('Url Value Object', () => {
  describe('creación válida', () => {
    it('debe crear una URL válida con https', () => {
      const url = Url.create('https://example.com');
      expect(url.getValue()).toBe('https://example.com');
    });

    it('debe crear una URL válida con http', () => {
      const url = Url.create('http://example.com');
      expect(url.getValue()).toBe('http://example.com');
    });

    it('debe crear una URL con path', () => {
      const url = Url.create('https://example.com/path/to/page');
      expect(url.getValue()).toBe('https://example.com/path/to/page');
    });

    it('debe crear una URL con query params', () => {
      const url = Url.create('https://example.com/page?query=test&page=1');
      expect(url.getValue()).toBe('https://example.com/page?query=test&page=1');
    });
  });

  describe('validación de URLs inválidas', () => {
    it('debe lanzar error para string vacío', () => {
      expect(() => Url.create('')).toThrow('Invalid URL');
    });

    it('debe lanzar error para texto sin formato URL', () => {
      expect(() => Url.create('not-a-url')).toThrow('Invalid URL');
    });

    it('debe lanzar error para URL sin protocolo', () => {
      expect(() => Url.create('example.com')).toThrow('Invalid URL');
    });

    it('debe lanzar error para URL con formato inválido', () => {
      expect(() => Url.create('http://')).toThrow('Invalid URL');
    });
  });

  describe('igualdad', () => {
    it('debe considerar iguales dos URLs con mismo valor', () => {
      const u1 = Url.create('https://example.com');
      const u2 = Url.create('https://example.com');
      expect(u1.equals(u2)).toBe(true);
    });

    it('debe considerar diferentes dos URLs distintas', () => {
      const u1 = Url.create('https://example.com');
      const u2 = Url.create('https://other.com');
      expect(u1.equals(u2)).toBe(false);
    });
  });
});
