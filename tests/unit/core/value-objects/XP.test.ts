import { describe, it, expect } from 'vitest';
import { XP, InvalidXPError } from '@/core/value-objects/XP';

describe('XP Value Object', () => {
  describe('creación válida', () => {
    it('debe crear XP con cantidad válida', () => {
      const xp = XP.create(100);
      expect(xp.amount).toBe(100);
    });

    it('debe crear XP cero', () => {
      const xp = XP.zero();
      expect(xp.amount).toBe(0);
      expect(xp.isZero()).toBe(true);
    });
  });

  describe('creación desde fuentes', () => {
    it('debe crear XP para completar capítulo (+2)', () => {
      const xp = XP.fromChapterComplete();
      expect(xp.amount).toBe(2);
    });

    it('debe crear XP para comentario (+5)', () => {
      const xp = XP.fromComment();
      expect(xp.amount).toBe(5);
    });

    it('debe crear XP para corrección aprobada (+20)', () => {
      const xp = XP.fromCorrection();
      expect(xp.amount).toBe(20);
    });

    it('debe crear XP para logro personalizado', () => {
      const xp = XP.fromAchievement(100);
      expect(xp.amount).toBe(100);
    });
  });

  describe('validación', () => {
    it('debe rechazar decimales', () => {
      expect(() => XP.create(100.5)).toThrow(InvalidXPError);
    });

    it('debe rechazar negativos', () => {
      expect(() => XP.create(-10)).toThrow(InvalidXPError);
    });

    it('debe rechazar montos excesivos', () => {
      expect(() => XP.create(1_000_000_000)).toThrow(InvalidXPError);
    });
  });

  describe('cálculo de niveles', () => {
    it('debe ser nivel 1 con 0 XP', () => {
      const xp = XP.create(0);
      expect(xp.level).toBe(1);
    });

    it('debe ser nivel 1 con 999 XP', () => {
      const xp = XP.create(999);
      expect(xp.level).toBe(1);
    });

    it('debe ser nivel 2 con 1000 XP', () => {
      const xp = XP.create(1000);
      expect(xp.level).toBe(2);
    });

    it('debe calcular nivel correctamente para altos valores', () => {
      const xp = XP.create(5500);
      expect(xp.level).toBe(6);
    });
  });

  describe('progreso al siguiente nivel', () => {
    it('debe calcular XP restante para siguiente nivel', () => {
      const xp = XP.create(800); // Nivel 1, necesita 200 más para nivel 2
      expect(xp.xpToNextLevel).toBe(200);
    });

    it('debe mostrar 0 si está justo en límite', () => {
      const xp = XP.create(1000); // Justo en nivel 2
      expect(xp.xpToNextLevel).toBe(0);
    });

    it('debe calcular porcentaje de progreso', () => {
      const xp = XP.create(500); // 50% del nivel 1
      expect(xp.progressToNextLevel).toBe(50);
    });
  });

  describe('ranks', () => {
    it('debe retornar Novato para nivel 1', () => {
      const xp = XP.create(0);
      expect(xp.rank).toBe('Novato');
    });

    it('debe retornar Lector Shonen para niveles 2-3', () => {
      expect(XP.create(1000).rank).toBe('Lector Shonen');
      expect(XP.create(2999).rank).toBe('Lector Shonen');
    });

    it('debe retornar Otaku Experto para niveles 4-6', () => {
      expect(XP.create(3000).rank).toBe('Otaku Experto');
      expect(XP.create(5999).rank).toBe('Otaku Experto');
    });

    it('debe retornar Maestro Otaku para niveles 7-9', () => {
      // 6000 XP = Nivel 7, 8000 XP = Nivel 9
      expect(XP.create(6000).rank).toBe('Maestro Otaku');
      expect(XP.create(8000).rank).toBe('Maestro Otaku');
    });

    it('debe retornar Leyenda Manga para nivel 10+', () => {
      expect(XP.create(10000).rank).toBe('Leyenda Manga');
      expect(XP.create(50000).rank).toBe('Leyenda Manga');
    });
  });

  describe('operaciones', () => {
    it('debe sumar XP', () => {
      const xp1 = XP.create(100);
      const xp2 = XP.create(50);
      const result = xp1.add(xp2);
      expect(result.amount).toBe(150);
    });

    it('debe considerar iguales XP iguales', () => {
      const xp1 = XP.create(100);
      const xp2 = XP.create(100);
      expect(xp1.equals(xp2)).toBe(true);
    });

    it('debe comparar mayor que', () => {
      const xp1 = XP.create(100);
      const xp2 = XP.create(50);
      expect(xp1.greaterThan(xp2)).toBe(true);
      expect(xp2.greaterThan(xp1)).toBe(false);
    });
  });

  describe('toString', () => {
    it('debe formatear con nivel y rango', () => {
      const xp = XP.create(5500);
      expect(xp.toString()).toBe('5500 XP (Nivel 6 - Otaku Experto)');
    });
  });
});
