import { describe, it, expect, beforeEach } from 'vitest';
import { NVIDIAProvider } from '@/infrastructure/ai/NVIDIAProvider';
import { InMemoryAIProvider } from '@/infrastructure/ai/InMemoryAIProvider';

describe('AI Provider Integration', () => {
  describe('InMemoryAIProvider (para desarrollo/testing)', () => {
    let provider: InMemoryAIProvider;

    beforeEach(() => {
      provider = new InMemoryAIProvider();
    });

    it('debe analizar comentarios sin spoilers', async () => {
      const analysis = await provider.analyzeComment('Me encanta este manga, es increíble!');

      expect(analysis.spoilerScore).toBeLessThan(30);
      expect(analysis.sentiment).toBe('positive');
      expect(analysis.toxicity).toBeLessThan(20);
    });

    it('debe detectar posibles spoilers', async () => {
      const analysis = await provider.analyzeComment(
        'El protagonista muere al final del capítulo, es una tragedia'
      );

      // "muere" = 15, "muerte" no está, "final" no está, "capítulo" no es keyword
      // El score depende de cuántas palabras de spoiler coincidan
      expect(analysis.spoilerScore).toBeGreaterThan(10);
    });

    it('debe generar embeddings deterministas', async () => {
      const embedding1 = await provider.generateEmbedding('test text');
      const embedding2 = await provider.generateEmbedding('test text');

      expect(embedding1).toEqual(embedding2);
      expect(embedding1.length).toBe(384);
    });

    it('debe calcular similitud entre embeddings', async () => {
      const emb1 = await provider.generateEmbedding('fantasy magic dragon');
      const emb2 = await provider.generateEmbedding('fantasy magic sword');
      const emb3 = await provider.generateEmbedding('technology computer');

      const sim12 = provider.calculateSimilarity(emb1, emb2);
      const sim13 = provider.calculateSimilarity(emb1, emb3);

      // Misma categoría = más similar
      expect(sim12).toBeGreaterThan(sim13);
    });

    it('debe clasificar géneros', async () => {
      const genres = await provider.classifyGenre(
        'A brave knight with a sword fighting a dragon in a magical kingdom'
      );

      expect(genres).toContain('Fantasía');
      expect(genres).toContain('Acción');
    });

    it('debe contar requests', async () => {
      expect(provider.getRequestCount()).toBe(0);

      await provider.analyzeComment('test');
      await provider.generateEmbedding('test');

      expect(provider.getRequestCount()).toBe(2);

      provider.reset();
      expect(provider.getRequestCount()).toBe(0);
    });
  });

  describe('NVIDIAProvider (con rate limiting)', () => {
    it('debe requerir API key', () => {
      expect(() => new NVIDIAProvider({ apiKey: '' })).toThrow();
    });

    it('debe inicializar con config personalizada', () => {
      const provider = new NVIDIAProvider({
        apiKey: 'test-key',
        maxRequestsPerMinute: 20,
      });

      expect(provider).toBeDefined();
    });
  });
});
