import { describe, it, expect } from 'vitest';
import { Description } from '@/core/value-objects/Description';

describe('Description Value Object', () => {
  describe('creación válida', () => {
    it('debe crear una descripción válida', () => {
      const desc = Description.create('Una historia emocionante');
      expect(desc.getValue()).toBe('Una historia emocionante');
    });

    it('debe permitir descripción vacía', () => {
      const desc = Description.create('');
      expect(desc.getValue()).toBe('');
    });
  });

  describe('validación de descripciones inválidas', () => {
    it('debe lanzar error para descripción demasiado larga (> 5000 chars)', () => {
      expect(() => Description.create('a'.repeat(5001))).toThrow('Description too long');
    });

    it('debe permitir descripción de exactamente 5000 caracteres', () => {
      const desc = Description.create('a'.repeat(5000));
      expect(desc.getValue()).toBe('a'.repeat(5000));
    });
  });

  describe('isEmpty', () => {
    it('debe retornar true si la descripción está vacía', () => {
      const desc = Description.create('');
      expect(desc.isEmpty()).toBe(true);
    });

    it('debe retornar false si la descripción no está vacía', () => {
      const desc = Description.create('Una descripción');
      expect(desc.isEmpty()).toBe(false);
    });
  });
});
