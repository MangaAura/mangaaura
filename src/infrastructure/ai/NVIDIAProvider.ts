import Bottleneck from 'bottleneck';

import {
  IAProvider,
  CommentAnalysis,
  ChapterSummary,
  AIServiceError,
  QualityAssessment,
} from '@/core/services/IAProvider';

interface NVIDIAConfig {
  apiKey: string;
  baseUrl: string;
  maxRequestsPerMinute: number;
}

export class NVIDIAProvider implements IAProvider {
  private readonly limiter: Bottleneck;
  private readonly config: NVIDIAConfig;
  private readonly cache: Map<string, unknown> = new Map();

  constructor(config: Partial<NVIDIAConfig> = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NVIDIA_API_KEY || '',
      baseUrl: config.baseUrl || 'https://integrate.api.nvidia.com/v1',
      maxRequestsPerMinute: config.maxRequestsPerMinute || 40,
    };

    if (!this.config.apiKey) {
      throw new Error('NVIDIA_API_KEY no está configurada');
    }

    // Rate limiting: 40 requests por minuto
    this.limiter = new Bottleneck({
      reservoir: this.config.maxRequestsPerMinute,
      reservoirRefreshAmount: this.config.maxRequestsPerMinute,
      reservoirRefreshInterval: 60 * 1000, // 1 minuto
      maxConcurrent: 1,
      minTime: 1500, // 1.5s entre requests (conservador)
    });

    // Eventos para monitoreo
    this.limiter.on('failed', (error, jobInfo) => {
      console.error(`Job ${jobInfo.options.id} failed:`, error);
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    payload: unknown,
    cacheKey?: string
  ): Promise<T> {
    // Verificar caché
    if (cacheKey && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T;
    }

    try {
      const response = await this.limiter.schedule(async () => {
        const res = await fetch(`${this.config.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new AIServiceError(
            errorData.error?.message || `HTTP ${res.status}`,
            `NVIDIA_${res.status}`,
            res.status === 429
          );
        }

        return res.json();
      });

      // Guardar en caché
      if (cacheKey) {
        this.cache.set(cacheKey, response);
        // TTL de 1 hora
        setTimeout(() => this.cache.delete(cacheKey), 3600000);
      }

      return response as T;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'Error desconocido',
        'NVIDIA_UNKNOWN'
      );
    }
  }

  async analyzeComment(
    content: string,
    context?: string
  ): Promise<CommentAnalysis> {
    const cacheKey = `analyze:${this.hash(content)}`;

    const prompt = `Analiza el siguiente comentario y determina:
1. Probabilidad de spoiler (0-100)
2. Sentimiento (positivo/negativo/neutral)
3. Toxicidad (0-100)
4. Categorías relevantes

Comentario: """${content}"""
${context ? `Contexto del capítulo: """${context}"""` : ''}

Responde en JSON exactamente con este formato:
{
  "spoilerScore": number,
  "sentiment": "positive" | "negative" | "neutral",
  "toxicity": number,
  "categories": string[]
}`;

    try {
      const response = await this.makeRequest<{
        choices: Array<{
          message: { content: string };
        }>;
      }>(
        '/chat/completions',
        {
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 256,
          response_format: { type: 'json_object' },
        },
        cacheKey
      );

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        spoilerScore: Math.min(100, Math.max(0, parsed.spoilerScore || 0)),
        sentiment: ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
          ? parsed.sentiment
          : 'neutral',
        toxicity: Math.min(100, Math.max(0, parsed.toxicity || 0)),
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      };
    } catch (error) {
      console.error('Error analizando comentario:', error);
      // Fallback: análisis básico
      return this.fallbackCommentAnalysis(content);
    }
  }

  async detectSpoiler(content: string, chapterContext: string): Promise<number> {
    const analysis = await this.analyzeComment(content, chapterContext);
    return analysis.spoilerScore;
  }

  async summarizeChapter(chapterText: string): Promise<ChapterSummary> {
    const cacheKey = `summary:${this.hash(chapterText.substring(0, 500))}`;

    const prompt = `Resume el siguiente capítulo de manga y genera un titular atractivo:

Texto del capítulo: """${chapterText.substring(0, 3000)}"""

Responde en JSON exactamente con este formato:
{
  "title": "Título corto del capítulo",
  "hook": "Titular atractivo para notificación push (máx 60 caracteres)",
  "keyEvents": ["evento 1", "evento 2", "evento 3"],
  "emotionalTone": "descripción del tono emocional"
}`;

    try {
      const response = await this.makeRequest<{
        choices: Array<{
          message: { content: string };
        }>;
      }>(
        '/chat/completions',
        {
          model: 'nvidia/llama-3.1-nemotron-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 512,
          response_format: { type: 'json_object' },
        },
        cacheKey
      );

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        title: parsed.title || 'Capítulo sin título',
        hook:
          parsed.hook?.substring(0, 60) ||
          '¡Nuevo capítulo disponible!',
        keyEvents: Array.isArray(parsed.keyEvents) ? parsed.keyEvents : [],
        emotionalTone: parsed.emotionalTone || 'neutral',
      };
    } catch (error) {
      console.error('Error generando resumen:', error);
      return {
        title: 'Capítulo',
        hook: '¡Nuevo capítulo disponible!',
        keyEvents: [],
        emotionalTone: 'neutral',
      };
    }
  }

  async generateNotificationHook(chapterSummary: string): Promise<string> {
    const prompt = `Genera un titular atractivo para notificación push basado en este resumen:
"""${chapterSummary}"""

El titular debe:
- Ser emocionante y crear curiosidad
- Máximo 60 caracteres
- Sin spoilers directos
- Incluir emojis relevantes

Responde solo con el titular, sin formato JSON.`;

    try {
      const response = await this.makeRequest<{
        choices: Array<{
          message: { content: string };
        }>;
      }>('/chat/completions', {
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 100,
      });

      return (
        response.choices[0]?.message?.content?.trim().substring(0, 60) ||
        '¡Nuevo capítulo disponible!'
      );
    } catch {
      return '¡Nuevo capítulo disponible!';
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${this.hash(text)}`;

    try {
      const response = await this.makeRequest<{
        data: Array<{ embedding: number[] }>;
      }>(
        '/embeddings',
        {
          input: text,
          model: 'nvidia/nv-embedqa-e5-v5',
          encoding_format: 'float',
        },
        cacheKey
      );

      return response.data[0]?.embedding || [];
    } catch (error) {
      console.error('Error generando embedding:', error);
      // Fallback: embedding vacío (busqueda caerá en fallback)
      return new Array(1024).fill(0);
    }
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    // Similitud de coseno
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  async classifyGenre(prompt: string): Promise<string[]> {
    const genrePrompt = `Clasifica el siguiente prompt de generación de imagen en géneros de manga:

Prompt: """${prompt.substring(0, 1000)}"""

Géneros disponibles: Acción, Aventura, Comedia, Drama, Fantasía, Romance, Ciencia Ficción, Terror, Misterio, Deportes, Slice of Life, Histórico, Mecha, Isekai

Responde en JSON con array de géneros (máximo 3):
{"genres": ["género1", "género2"]}`;

    try {
      const response = await this.makeRequest<{
        choices: Array<{
          message: { content: string };
        }>;
      }>('/chat/completions', {
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{ role: 'user', content: genrePrompt }],
        temperature: 0.3,
        max_tokens: 128,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return Array.isArray(parsed.genres) ? parsed.genres.slice(0, 3) : [];
    } catch {
      return [];
    }
  }

  async classifyQuality(imageUrl: string): Promise<QualityAssessment> {
    // Para imágenes, usamos análisis de prompt
    const prompt = `Analiza la calidad técnica de una imagen de manga generada por IA:

URL: ${imageUrl}

Responde en JSON:
{
  "score": number (0-100),
  "issues": [
    {"type": "typo|artifact|incoherence|anatomy|other", "severity": "low|medium|high|critical", "description": "...", "confidence": number}
  ],
  "overallQuality": "excellent|good|fair|poor"
}`;

    try {
      const response = await this.makeRequest<{
        choices: Array<{
          message: { content: string };
        }>;
      }>('/chat/completions', {
        model: 'nvidia/llama-3.1-nemotron-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        score: Math.min(100, Math.max(0, parsed.score || 70)),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        overallQuality: ['excellent', 'good', 'fair', 'poor'].includes(
          parsed.overallQuality
        )
          ? parsed.overallQuality
          : 'fair',
      };
    } catch {
      return {
        score: 70,
        issues: [],
        overallQuality: 'fair',
      };
    }
  }

  // Fallback para cuando la IA no está disponible
  private fallbackCommentAnalysis(content: string): CommentAnalysis {
    const lowerContent = content.toLowerCase();

    // Palabras que indican spoiler
    const spoilerWords = [
      'muere',
      'muerte',
      'asesin',
      'mató',
      'mata',
      'revél',
      'secreto',
      'traición',
      'traidor',
      'final',
      'último capítulo',
      'giró',
      'plot twist',
      'spoiler',
    ];

    let spoilerScore = 0;
    for (const word of spoilerWords) {
      if (lowerContent.includes(word)) {
        spoilerScore += 15;
      }
    }

    // Palabras de sentimiento
    const positiveWords = ['bueno', 'excelente', 'increíble', 'me encanta', 'genial'];
    const negativeWords = ['malo', 'horrible', 'odio', 'peor', 'basura'];

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const hasPositive = positiveWords.some((w) => lowerContent.includes(w));
    const hasNegative = negativeWords.some((w) => lowerContent.includes(w));

    if (hasPositive && !hasNegative) sentiment = 'positive';
    else if (hasNegative && !hasPositive) sentiment = 'negative';

    // Toxicidad simple
    const toxicWords = ['tonto', 'idiota', 'estúpido', 'basura', 'mierda'];
    const toxicity = toxicWords.some((w) => lowerContent.includes(w)) ? 50 : 10;

    return {
      spoilerScore: Math.min(100, spoilerScore),
      sentiment,
      toxicity,
      categories: [],
    };
  }

  private hash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // Utilidades
  getCacheSize(): number {
    return this.cache.size;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async getRateLimitStats(): Promise<{
    reservoir: number;
    queued: number;
    running: number;
  }> {
    const counts = this.limiter.counts() as any;
    return {
      reservoir: (counts as any).RECEIVED || 0,
      queued: await (this.limiter as any).queued(),
      running: await (this.limiter as any).running(),
    };
  }
}
