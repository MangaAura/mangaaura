/**
 * Comment Moderation Service
 *
 * Servicio de moderación de comentarios con detección de toxicidad.
 * Usa análisis de IA (NVIDIA + fallback InMemory) y filtros heurísticos.
 */

import { IAProvider, CommentAnalysis } from '@/core/services/IAProvider';

export interface ModerationResult {
  isApproved: boolean;
  isHidden: boolean;
  toxicity: number;
  spoilerScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  categories: string[];
  flaggedWords: string[];
  reason?: string;
  requiresReview: boolean;
}

interface ToxicPattern {
  pattern: RegExp;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
}

// Patrones de toxicidad multilingüe
const TOXIC_PATTERNS: ToxicPattern[] = [
  // Insultos y acoso
  { pattern: /\b(idiota|est[úu]pido|imb[eé]cil|mongol[oa]|retrasad[oa]|subnormal|cretino|tarado|pelotudo|boludo|gilipollas|cabrón|pendejo|puto|maricón)\b/i, category: 'insult', severity: 'high', score: 60 },
  // Lenguaje ofensivo
  { pattern: /\b(mierda|joder|coño|carajo|chinga|verga|pinga|concha)\b/i, category: 'profanity', severity: 'low', score: 20 },
  // Amenazas
  { pattern: /\b(te (voy )?a (matar|buscar|encontrar|pegar|golpear|romper)|voy a (acabar|terminar) contigo|ojal[aá] te mueras|m[aá]tate|suic[ií]date)\b/i, category: 'threat', severity: 'critical', score: 95 },
  // Racismo/discriminación
  { pattern: /\b(negro de mierda|indio de mierda|chino de mierda|jud[ií]o de mierda|gitano de mierda|sudaca|panchito|moro de mierda)\b/i, category: 'hate_speech', severity: 'critical', score: 100 },
  { pattern: /\b(machista|feminazi|heterofóbico|homófobo|transfóbico)\b/i, category: 'harassment', severity: 'medium', score: 30 },
  // Spam
  { pattern: /(https?:\/\/|www\.)[^\s]{3,}/i, category: 'spam', severity: 'low', score: 15 },
  { pattern: /(visita mi perfil|s[ií]gueme|follow me|sub4sub|like4like|sorteo|concurso).{0,30}(https?:\/\/|@\w+)/i, category: 'spam', severity: 'medium', score: 40 },
  // Autolesión
  { pattern: /\b(me quiero (morir|matar|suicidar)|ya no quiero vivir|no vale la pena vivir|me voy a (matar|suicidar))\b/i, category: 'self_harm', severity: 'critical', score: 100 },
];

// Palabras que indican posible spoiler
const SPOILER_PATTERNS: ToxicPattern[] = [
  { pattern: /\b(muere|muerte|muertos?|murió|asesin|mat[oó]|mata|fallece)\b/i, category: 'spoiler', severity: 'high', score: 25 },
  { pattern: /\b(revela|secreto|resulta que|en realidad|plot twist|giro|inesperado|sorpresa)\b/i, category: 'spoiler', severity: 'medium', score: 20 },
  { pattern: /\b(final|último cap|capítulo final|se termina|acaba|desenlace)\b/i, category: 'spoiler', severity: 'medium', score: 20 },
  { pattern: /\b(traición|traidor|aliado enemigo|verdadera identidad|doble agente|villano\s+real)\b/i, category: 'spoiler', severity: 'high', score: 25 },
];

async function getAIProvider(): Promise<IAProvider> {
  try {
    if (process.env.NVIDIA_API_KEY) {
      const { NVIDIAProvider } = await import('@/infrastructure/ai/NVIDIAProvider');
      return new NVIDIAProvider();
    }
  } catch {
    // Fallback to in-memory
  }

  const { InMemoryAIProvider } = await import('@/infrastructure/ai/InMemoryAIProvider');
  return new InMemoryAIProvider();
}

export async function moderateComment(
  content: string,
  _options: { userId?: string; isReply?: boolean } = {}
): Promise<ModerationResult> {
  const flaggedWords: string[] = [];
  let totalToxicity = 0;
  let maxSeverity: ModerationResult['requiresReview'] = false;
  const categories: Set<string> = new Set();
  let highestCategoryScore = 0;

  // Checks heurísticos de toxicidad
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.pattern.test(content)) {
      totalToxicity += pattern.score;
      categories.add(pattern.category);
      flaggedWords.push(pattern.category);

      if (pattern.severity === 'critical') {
        maxSeverity = true;
      }
      if (pattern.score > highestCategoryScore) {
        highestCategoryScore = pattern.score;
      }
    }
  }

  // Checks de spoiler
  let spoilerScore = 0;
  for (const pattern of SPOILER_PATTERNS) {
    if (pattern.pattern.test(content)) {
      spoilerScore += pattern.score;
      categories.add(pattern.category);
    }
  }

  // Si el contenido es muy corto y no tiene patrones, probablemente es seguro
  if (content.trim().length < 5 && totalToxicity === 0) {
    return {
      isApproved: true,
      isHidden: false,
      toxicity: 0,
      spoilerScore: 0,
      sentiment: 'neutral',
      categories: [],
      flaggedWords: [],
      requiresReview: false,
    };
  }

  // Normalizar toxicidad
  const heuristicToxicity = Math.min(100, totalToxicity);
  spoilerScore = Math.min(100, spoilerScore);

  // Análisis de IA (NVIDIA o fallback InMemory)
  let aiAnalysis: CommentAnalysis | null = null;
  try {
    const provider = await getAIProvider();
    aiAnalysis = await provider.analyzeComment(content);
  } catch (error) {
    console.warn('[Moderation] AI analysis failed, using heuristic only:', error);
  }

  // Combinar puntuaciones heurísticas y de IA
  const finalToxicity = aiAnalysis
    ? Math.max(heuristicToxicity, aiAnalysis.toxicity)
    : heuristicToxicity;

  const finalSpoilerScore = aiAnalysis
    ? Math.max(spoilerScore, aiAnalysis.spoilerScore)
    : spoilerScore;

  const finalSentiment = aiAnalysis?.sentiment || 'neutral';

  if (aiAnalysis?.categories) {
    aiAnalysis.categories.forEach((c) => categories.add(c));
  }

  // Decisión de moderación
  const isCritical = finalToxicity >= 80 || maxSeverity;
  const isHidden = finalSpoilerScore > 70 || isCritical;
  const isApproved = finalToxicity < 50;
  const requiresReview = finalToxicity >= 50 || isCritical;

  let reason: string | undefined;
  if (isCritical) {
    reason = 'Contenido tóxico grave detectado';
  } else if (finalSpoilerScore > 70) {
    reason = 'Posible spoiler detectado por IA';
  } else if (finalToxicity >= 50) {
    reason = 'Contenido potencialmente inapropiado';
  }

  return {
    isApproved,
    isHidden,
    toxicity: finalToxicity,
    spoilerScore: finalSpoilerScore,
    sentiment: finalSentiment,
    categories: Array.from(categories),
    flaggedWords,
    reason,
    requiresReview,
  };
}

export function quickFilterSpam(content: string): boolean {
  let spamScore = 0;

  // URL
  if (/(https?:\/\/|www\.)\S{4,}/i.test(content)) spamScore++;
  // Casino/crypto/pharma spam keywords
  if (/\b(viagra|casino|apuesta|cripto(mone?a)?|tr[aá]baj[ao] desd[a-z]\s*casa)\b/i.test(content)) spamScore++;
  // Repeated character (more than 20 same chars)
  if (/([a-zA-Z0-9])\1{19,}/.test(content)) spamScore += 2;

  return spamScore >= 2;
}

export async function batchModerateComments(
  comments: Array<{ id: string; content: string }>
): Promise<Map<string, ModerationResult>> {
  const results = new Map<string, ModerationResult>();

  await Promise.all(
    comments.map(async (comment) => {
      if (quickFilterSpam(comment.content)) {
        results.set(comment.id, {
          isApproved: false,
          isHidden: true,
          toxicity: 100,
          spoilerScore: 0,
          sentiment: 'neutral',
          categories: ['spam'],
          flaggedWords: ['spam'],
          reason: 'Spam detectado automáticamente',
          requiresReview: true,
        });
      } else {
        const result = await moderateComment(comment.content);
        results.set(comment.id, result);
      }
    })
  );

  return results;
}