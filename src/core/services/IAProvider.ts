// Port para el servicio de IA (Arquitectura Hexagonal)

export interface CommentAnalysis {
  spoilerScore: number; // 0-100 probabilidad de spoiler
  sentiment: 'positive' | 'negative' | 'neutral';
  toxicity: number; // 0-100
  categories: string[]; // 'question', 'theory', 'review', etc.
  summary?: string;
}

export interface ChapterSummary {
  title: string;
  hook: string; // Titular atractivo para notificaciones
  keyEvents: string[];
  emotionalTone: string;
}

export interface SearchResult {
  mangaId: string;
  relevanceScore: number; // 0-100
  explanation: string;
}

export interface IAProvider {
  // Análisis de contenido
  analyzeComment(content: string, context?: string): Promise<CommentAnalysis>;
  detectSpoiler(content: string, chapterContext: string): Promise<number>;

  // Generación
  summarizeChapter(chapterText: string): Promise<ChapterSummary>;
  generateNotificationHook(chapterSummary: string): Promise<string>;

  // Embeddings (para búsqueda semántica)
  generateEmbedding(text: string): Promise<number[]>;
  calculateSimilarity(embedding1: number[], embedding2: number[]): number;

  // Clasificación
  classifyGenre(prompt: string): Promise<string[]>;
  classifyQuality(imageUrl: string): Promise<QualityAssessment>;
}

export interface QualityAssessment {
  score: number; // 0-100
  issues: QualityIssue[];
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface QualityIssue {
  type: 'typo' | 'artifact' | 'incoherence' | 'anatomy' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
}

// Error específico del servicio IA
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRateLimit: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// Factory para crear providers
export interface IAProviderFactory {
  createProvider(): IAProvider;
}
