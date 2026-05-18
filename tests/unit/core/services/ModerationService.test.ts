import { describe, it, expect } from 'vitest';

import { moderateComment, quickFilterSpam } from '@/services/ModerationService';

describe('ModerationService', () => {
  describe('quickFilterSpam', () => {
    it('should detect URLs as spam', () => {
      expect(quickFilterSpam('Visita https://mysite.com a este casino')).toBe(true);
    });

    it('should detect casino spam', () => {
      expect(quickFilterSpam('Visita https://casino.com gana dinero')).toBe(true);
    });

    it('should detect repeated characters', () => {
      expect(quickFilterSpam('aaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(true);
    });

    it('should allow normal comments', () => {
      expect(quickFilterSpam('Me encantó este capítulo, el arte es increíble')).toBe(false);
    });
  });

  describe('moderateComment - safe content', () => {
    it('should approve normal comments', async () => {
      const result = await moderateComment('Este capítulo estuvo muy bueno');
      expect(result.isApproved).toBe(true);
      expect(result.isHidden).toBe(false);
      expect(result.toxicity).toBeLessThan(50);
    });

    it('should approve positive feedback', async () => {
      const result = await moderateComment('Increíble trabajo del autor, me encanta esta serie');
      expect(result.isApproved).toBe(true);
    });
  });

  describe('moderateComment - insults', () => {
    it('should detect insults as toxic', async () => {
      const result = await moderateComment('Eres un idiota y un estúpido');
      expect(result.toxicity).toBeGreaterThanOrEqual(50);
      expect(result.categories).toContain('insult');
    });

    it('should flag hate speech as critical', async () => {
      const result = await moderateComment('negro de mierda');
      expect(result.toxicity).toBeGreaterThanOrEqual(80);
      expect(result.isHidden).toBe(true);
      expect(result.requiresReview).toBe(true);
    });
  });

  describe('moderateComment - spoilers', () => {
    it('should detect spoiler words', async () => {
      const result = await moderateComment('¡Al final el protagonista muere y hay un plot twist!');
      expect(result.spoilerScore).toBeGreaterThan(0);
      expect(result.categories).toContain('spoiler');
    });

    it('should hide comments with high spoiler score', async () => {
      const result = await moderateComment(
        'Muere el héroe por traición del doble agente en el capítulo final con un giro inesperado que revela el secreto'
      );
      expect(result.spoilerScore).toBeGreaterThan(70);
      expect(result.isHidden).toBe(true);
    });
  });

  describe('moderateComment - threats', () => {
    it('should detect threats as critical', async () => {
      const result = await moderateComment('te voy a matar');
      expect(result.toxicity).toBeGreaterThanOrEqual(80);
      expect(result.isHidden).toBe(true);
      expect(result.categories).toContain('threat');
    });
  });

  describe('moderateComment - short content', () => {
    it('should approve very short safe comments', async () => {
      const result = await moderateComment('OK');
      expect(result.isApproved).toBe(true);
      expect(result.toxicity).toBe(0);
    });
  });

  describe('moderateComment - profanity (low severity)', () => {
    it('should flag profanity but not block it', async () => {
      const result = await moderateComment('¡Qué mierda de final! Joder, no me lo esperaba');
      expect(result.categories).toContain('profanity');
      expect(result.toxicity).toBeLessThan(80);
    });
  });
});