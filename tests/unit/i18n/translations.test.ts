import { describe, it, expect } from 'vitest';

// This tests translations at the module level without needing full React
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';

describe('i18n translations', () => {
  describe('Spanish translations', () => {
    it('should have common keys', () => {
      expect(es.common.loading).toBe('Cargando...');
      expect(es.common.error).toBe('Error');
      expect(es.common.retry).toBe('Reintentar');
    });

    it('should have navigation keys', () => {
      expect(es.nav.home).toBe('Inicio');
      expect(es.nav.browse).toBe('Navegar');
      expect(es.nav.library).toBe('Biblioteca');
    });

    it('should have manga keys', () => {
      expect(es.manga.reading).toBe('Leyendo');
      expect(es.manga.completed).toBe('Completado');
      expect(es.manga.addToLibrary).toBe('Agregar a biblioteca');
    });

    it('should have reader keys', () => {
      expect(es.reader.page).toBe('Página');
      expect(es.reader.darkMode).toBe('Modo oscuro');
      expect(es.reader.fullscreen).toBe('Pantalla completa');
    });

    it('should have auth keys', () => {
      expect(es.auth.loginTitle).toBe('Iniciar sesión');
      expect(es.auth.registerTitle).toBe('Crear cuenta');
    });

    it('should have achievement keys', () => {
      expect(es.achievements.title).toBe('Logros');
      expect(es.achievements.difficulty.EASY).toBe('Fácil');
      expect(es.achievements.difficulty.LEGENDARY).toBe('Legendario');
    });
  });

  describe('English translations', () => {
    it('should have common keys', () => {
      expect(en.common.loading).toBe('Loading...');
      expect(en.common.error).toBe('Error');
      expect(en.common.retry).toBe('Retry');
    });

    it('should have navigation keys', () => {
      expect(en.nav.home).toBe('Home');
      expect(en.nav.library).toBe('Library');
    });

    it('should have manga keys', () => {
      expect(en.manga.reading).toBe('Reading');
      expect(en.manga.completed).toBe('Completed');
      expect(en.manga.addToLibrary).toBe('Add to library');
    });

    it('should have achievement keys', () => {
      expect(en.achievements.difficulty.EASY).toBe('Easy');
      expect(en.achievements.difficulty.LEGENDARY).toBe('Legendary');
    });
  });

  describe('translation completeness', () => {
    function getKeys(obj: any, prefix = ''): string[] {
      const keys: string[] = [];
      for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          keys.push(...getKeys(obj[key], fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    function getValue(obj: any, path: string): any {
      return path.split('.').reduce((o, k) => o?.[k], obj);
    }

    it('should have all Spanish keys also in English', () => {
      const esKeys = getKeys(es);
      const enKeys = new Set(getKeys(en));

      for (const key of esKeys) {
        const esValue = getValue(es, key);
        if (typeof esValue === 'string') {
          expect(enKeys.has(key), `Missing English key: ${key}`).toBe(true);
        }
      }
    });
  });
});