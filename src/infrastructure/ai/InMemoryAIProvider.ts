import {
  IAProvider,
  CommentAnalysis,
  ChapterSummary,
  QualityAssessment,
  EmailIntentResult,
} from '@/core/services/IAProvider';

// Implementación en memoria para testing y desarrollo
// No hace llamadas a NVIDIA, usa lógica simple/heurística
export class InMemoryAIProvider implements IAProvider {
  private requestCount = 0;

  async analyzeComment(content: string): Promise<CommentAnalysis> {
    this.requestCount++;

    const lowerContent = content.toLowerCase();

    // Palabras que indican spoiler
    const spoilerWords = [
      'muere', 'muerte', 'asesin', 'mató', 'mata', 'revél', 'secreto',
      'traición', 'traidor', 'final', 'último capítulo', 'giró', 'plot twist', 'spoiler',
    ];

    let spoilerScore = 0;
    for (const word of spoilerWords) {
      if (lowerContent.includes(word)) spoilerScore += 15;
    }

    // Palabras de sentimiento
    const positiveWords = ['bueno', 'excelente', 'increíble', 'me encanta', 'genial', '👍', '❤️'];
    const negativeWords = ['malo', 'horrible', 'odio', 'peor', 'basura', '👎', '😡'];

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    const hasPositive = positiveWords.some((w) => lowerContent.includes(w));
    const hasNegative = negativeWords.some((w) => lowerContent.includes(w));

    if (hasPositive && !hasNegative) sentiment = 'positive';
    else if (hasNegative && !hasPositive) sentiment = 'negative';

    // Toxicidad simple
    const toxicWords = ['tonto', 'idiota', 'estúpido', 'basura', 'mierda', 'puta', 'maldito'];
    const toxicity = toxicWords.some((w) => lowerContent.includes(w)) ? 60 : 10;

    return {
      spoilerScore: Math.min(100, spoilerScore),
      sentiment,
      toxicity,
      categories: [],
    };
  }

  async detectSpoiler(content: string): Promise<number> {
    const analysis = await this.analyzeComment(content);
    return analysis.spoilerScore;
  }

  async summarizeChapter(chapterText: string): Promise<ChapterSummary> {
    this.requestCount++;

    // Extraer primeras palabras para "resumen"
    const words = chapterText.split(' ').slice(0, 20).join(' ');

    return {
      title: 'Capítulo sin título',
      hook: '¡Nuevo capítulo disponible!',
      keyEvents: [words + '...'],
      emotionalTone: 'neutral',
    };
  }

  async generateNotificationHook(_chapterSummary: string): Promise<string> {
    this.requestCount++;
    return '¡Nuevo capítulo disponible! Lee ahora 🔥';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.requestCount++;
    // Generar embedding determinista basado en el texto
    const hash = this.hashCode(text);
    const embedding: number[] = [];
    const random = this.seededRandom(hash);

    for (let i = 0; i < 384; i++) {
      embedding.push(random() * 2 - 1); // Valores entre -1 y 1
    }

    // Normalizar
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / magnitude);
  }

  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
    }

    return Math.max(0, Math.min(1, (dotProduct + 1) / 2)); // Normalizar a 0-1
  }

  async classifyGenre(prompt: string): Promise<string[]> {
    this.requestCount++;

    const lowerPrompt = prompt.toLowerCase();
    const genres: string[] = [];

    const genreKeywords: Record<string, string[]> = {
      Acción: ['action', 'fight', 'battle', 'combat', 'lucha'],
      Aventura: ['adventure', 'journey', 'quest', 'travel', 'explore'],
      Fantasía: ['fantasy', 'magic', 'dragon', 'wizard', 'spell'],
      Romance: ['romance', 'love', 'couple', 'relationship', 'kiss'],
      Terror: ['horror', 'scary', 'ghost', 'monster', 'fear'],
      'Ciencia Ficción': ['sci-fi', 'space', 'robot', 'future', 'alien', 'technology'],
      Comedia: ['comedy', 'funny', 'humor', 'laugh'],
      Drama: ['drama', 'emotional', 'sad', 'tragic'],
      Misterio: ['mystery', 'detective', 'crime', 'puzzle'],
      Deportes: ['sports', 'soccer', 'basketball', 'tennis', 'team'],
    };

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some((kw) => lowerPrompt.includes(kw))) {
        genres.push(genre);
      }
    }

    return genres.slice(0, 3);
  }

  async classifyQuality(): Promise<QualityAssessment> {
    this.requestCount++;

    return {
      score: 75,
      issues: [],
      overallQuality: 'good',
    };
  }

  async classifyEmailIntent(params: {
    subject: string
    body: string
    fromEmail: string
  }): Promise<EmailIntentResult> {
    this.requestCount++;

    const lowerSubject = params.subject.toLowerCase()
    const lowerBody = params.body.toLowerCase()

    const unsubscribeWords = ['unsubscribe', 'baja', 'cancelar', 'dejar de recibir', 'spam', 'no más correos']
    const reportWords = ['report', 'reportar', 'abus', 'spam', 'denunci', 'inappropriate', 'acoso']
    const supportWords = ['help', 'ayuda', 'problema', 'error', 'bug', 'no funciona', 'cómo', 'tutorial', 'soporte']
    const replyWords = ['comment', 'comentario', 'reply', 'responder', 'chapter', 'capítulo']

    let intent: EmailIntentResult['intent'] = 'unknown'
    let confidence = 0.3
    let requiresHuman = true

    if (unsubscribeWords.some(w => lowerSubject.includes(w) || lowerBody.includes(w))) {
      intent = 'unsubscribe'
      confidence = 0.7
      requiresHuman = false
    } else if (reportWords.some(w => lowerSubject.includes(w) || lowerBody.includes(w))) {
      intent = 'report'
      confidence = 0.6
    } else if (supportWords.some(w => lowerSubject.includes(w) || lowerBody.includes(w))) {
      intent = 'support'
      confidence = 0.6
    } else if (replyWords.some(w => lowerSubject.includes(w) || lowerBody.includes(w))) {
      intent = 'comment_reply'
      confidence = 0.5
    }

    return {
      intent,
      confidence,
      requiresHuman,
      suggestedResponse: null,
      extractedEntities: {
        userId: null,
        mangaSlug: null,
        commentId: null,
      },
    };
  }

  // Utilidades
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;

    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  reset(): void {
    this.requestCount = 0;
  }
}
