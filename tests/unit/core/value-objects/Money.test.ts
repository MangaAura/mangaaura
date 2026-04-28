import { describe, it, expect } from 'vitest';
import { Money, InvalidAmountError, InsufficientFundsError } from '@/core/value-objects/Money';

describe('Money Value Object', () => {
  describe('creación válida', () => {
    it('debe crear dinero con cantidad válida', () => {
      const money = Money.create(100, 'INK');
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('INK');
    });

    it('debe usar INK como moneda por defecto', () => {
      const money = Money.create(50);
      expect(money.currency).toBe('INK');
    });

    it('debe crear dinero cero', () => {
      const money = Money.zero();
      expect(money.amount).toBe(0);
      expect(money.isZero()).toBe(true);
    });
  });

  describe('validación de cantidades inválidas', () => {
    it('debe rechazar decimales', () => {
      expect(() => Money.create(100.5)).toThrow(InvalidAmountError);
      expect(() => Money.create(100.5)).toThrow(/entero/);
    });

    it('debe rechazar negativos', () => {
      expect(() => Money.create(-100)).toThrow(InvalidAmountError);
      expect(() => Money.create(-100)).toThrow(/negativo/);
    });

    it('debe rechazar montos excesivos', () => {
      expect(() => Money.create(1_000_000_000)).toThrow(InvalidAmountError);
      expect(() => Money.create(1_000_000_000)).toThrow(/límite/);
    });
  });

  describe('operaciones aritméticas', () => {
    it('debe sumar dinero de misma moneda', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(50);
      const result = m1.add(m2);
      expect(result.amount).toBe(150);
    });

    it('debe restar dinero de misma moneda', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(30);
      const result = m1.subtract(m2);
      expect(result.amount).toBe(70);
    });

    it('debe lanzar error al restar más de lo disponible', () => {
      const m1 = Money.create(50);
      const m2 = Money.create(100);
      expect(() => m1.subtract(m2)).toThrow(InsufficientFundsError);
    });

    it('debe rechazar operaciones con monedas diferentes', () => {
      const ink = Money.create(100, 'INK');
      const usd = Money.create(50, 'USD');
      expect(() => ink.add(usd)).toThrow(InvalidAmountError);
    });

    it('debe verificar si puede restar con canSubtract', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(50);
      const m3 = Money.create(150);
      expect(m1.canSubtract(m2)).toBe(true);
      expect(m1.canSubtract(m3)).toBe(false);
    });
  });

  describe('comparación', () => {
    it('debe considerar iguales dos montos idénticos', () => {
      const m1 = Money.create(100, 'INK');
      const m2 = Money.create(100, 'INK');
      expect(m1.equals(m2)).toBe(true);
    });

    it('debe considerar diferentes si cantidad difiere', () => {
      const m1 = Money.create(100);
      const m2 = Money.create(200);
      expect(m1.equals(m2)).toBe(false);
    });

    it('debe considerar diferentes si moneda difiere', () => {
      const m1 = Money.create(100, 'INK');
      const m2 = Money.create(100, 'USD');
      expect(m1.equals(m2)).toBe(false);
    });

    it('debe detectar montos positivos', () => {
      const m = Money.create(1);
      expect(m.isPositive()).toBe(true);
      expect(Money.zero().isPositive()).toBe(false);
    });
  });

  describe('toString', () => {
    it('debe formatear correctamente', () => {
      const money = Money.create(500, 'INK');
      expect(money.toString()).toBe('500 INK');
    });
  });
});
