/**
 * AI Image Generation - Configuration & Provider Abstraction
 *
 * Defines supported models, pricing (based on real API costs),
 * and provider implementations for OpenAI GPT-Image-2 and Gemini Nano Banana Pro.
 *
 * Pricing reference (June 2026):
 *   OpenAI GPT-Image-2: ~$0.04-0.17/image (token-based)
 *   Gemini Nano Banana Pro: ~$0.045-0.24/image (resolution-based)
 *
 * 1 Aura ≈ $0.01 USD → we apply a ~1.5x multiplier to cover platform costs.
 */

// ============================================================================
// Types
// ============================================================================

export type ImageProvider = 'openai' | 'gemini';

export type ImageQuality = 'standard' | 'hd' | 'ultra';

export type ImageStyle = 'vivid' | 'natural' | 'anime' | 'manga';

export interface ImageGenerationModel {
  id: string;
  provider: ImageProvider;
  name: string;
  description: string;
  /** Real API cost in USD cents for one generation */
  costUsdCents: number;
  /** Aura cost (costUsdCents × ~1.5 markup) */
  auraCost: number;
  /** Supported qualities */
  qualities: ImageQuality[];
  /** Supported styles */
  styles: ImageStyle[];
  /** Max supported resolution */
  maxWidth: number;
  maxHeight: number;
  /** Whether the model supports negative prompts */
  supportsNegativePrompt: boolean;
  /** Whether the model supports seed for reproducible results */
  supportsSeed: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  modelId: string;
  width?: number;
  height?: number;
  quality?: ImageQuality;
  style?: ImageStyle;
  seed?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
  seed?: number;
  provider: ImageProvider;
  modelId: string;
  /** The raw API response data for storage/debugging */
  rawResponse?: unknown;
}

export interface ImageGenerationProvider {
  readonly name: string;
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

// ============================================================================
// Model Definitions & Pricing
// ============================================================================

/**
 * All supported image generation models with their real cost and Aura price.
 *
 * Costs are based on ~$0.01 per Aura with ~1.5x markup to sustain the service.
 * Standard quality = ~1000px, HD = 2048px, Ultra = 4096px
 */
export const IMAGE_MODELS: ImageGenerationModel[] = [
  // ── OpenAI GPT-Image-2 ──────────────────────────────────────────
  {
    id: 'openai/gpt-image-2-standard',
    provider: 'openai',
    name: 'GPT-Image 2.0',
    description: 'OpenAI GPT-Image-2 rápida y económica para uso general',
    costUsdCents: 4,
    auraCost: 6,
    qualities: ['standard'],
    styles: ['vivid', 'natural'],
    maxWidth: 1024,
    maxHeight: 1024,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'openai/gpt-image-2-hd',
    provider: 'openai',
    name: 'GPT-Image 2.0 HD',
    description: 'Mayor calidad con más detalle',
    costUsdCents: 10,
    auraCost: 15,
    qualities: ['hd'],
    styles: ['vivid', 'natural'],
    maxWidth: 2048,
    maxHeight: 2048,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },
  {
    id: 'openai/gpt-image-2-ultra',
    provider: 'openai',
    name: 'GPT-Image 2.0 Ultra',
    description: 'Máxima calidad para impresión y uso profesional',
    costUsdCents: 17,
    auraCost: 25,
    qualities: ['ultra'],
    styles: ['vivid', 'natural'],
    maxWidth: 4096,
    maxHeight: 4096,
    supportsNegativePrompt: false,
    supportsSeed: true,
  },

  // ── Gemini Nano Banana Pro ──────────────────────────────────────
  {
    id: 'gemini/nano-banana-standard',
    provider: 'gemini',
    name: 'Nano Banana Pro',
    description: 'Generación con Gemini 3 Pro optimizada para anime/manga',
    costUsdCents: 5,
    auraCost: 8,
    qualities: ['standard'],
    styles: ['anime', 'manga', 'vivid', 'natural'],
    maxWidth: 1024,
    maxHeight: 1024,
    supportsNegativePrompt: true,
    supportsSeed: false,
  },
  {
    id: 'gemini/nano-banana-hd',
    provider: 'gemini',
    name: 'Nano Banana Pro HD',
    description: 'Alta resolución ideal para portadas y banners',
    costUsdCents: 10,
    auraCost: 15,
    qualities: ['hd'],
    styles: ['anime', 'manga', 'vivid', 'natural'],
    maxWidth: 2048,
    maxHeight: 2048,
    supportsNegativePrompt: true,
    supportsSeed: false,
  },
  {
    id: 'gemini/nano-banana-ultra',
    provider: 'gemini',
    name: 'Nano Banana Pro Ultra',
    description: 'Resolución 4K para uso profesional y merchandise',
    costUsdCents: 20,
    auraCost: 30,
    qualities: ['ultra'],
    styles: ['anime', 'manga', 'vivid', 'natural'],
    maxWidth: 4096,
    maxHeight: 4096,
    supportsNegativePrompt: true,
    supportsSeed: false,
  },
];

/**
 * Get a model by its ID
 */
export function getModelById(modelId: string): ImageGenerationModel | undefined {
  return IMAGE_MODELS.find((m) => m.id === modelId);
}

/**
 * Calculate aura cost for a generation request based on the model
 */
export function calculateAuraCost(modelId: string): number {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);
  return model.auraCost;
}

/**
 * Get models grouped by provider
 */
export function getModelsByProvider(): Record<ImageProvider, ImageGenerationModel[]> {
  const grouped: Record<ImageProvider, ImageGenerationModel[]> = {
    openai: [],
    gemini: [],
  };
  for (const model of IMAGE_MODELS) {
    grouped[model.provider].push(model);
  }
  return grouped;
}

// ============================================================================
// Providers
// ============================================================================

/**
 * OpenAI GPT-Image-2 provider
 */
export class OpenAIProvider implements ImageGenerationProvider {
  readonly name = 'openai';

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const model = getModelById(request.modelId);
    if (!model) throw new Error(`Unknown model: ${request.modelId}`);

    const quality = request.quality || 'standard';

    // GPT-4o image generation via chat completions (GPT-Image-2 / ChatGPT Image 2.0)
    // This endpoint supports text + image output in a single chat completion call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: request.prompt,
              },
            ],
          },
        ],
        n: 1,
        ...(quality === 'ultra' ? { quality: 'hd' } : {}),
        ...(request.seed ? { seed: request.seed } : {}),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      throw new Error(err.error?.message || `OpenAI error: ${response.status}`);
    }

    const data = await response.json();

    // GPT-4o returns image as base64 inline data in the response content
    let imageUrl: string | undefined;
    let seed: number | undefined;

    const content = data.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'image_url') {
          imageUrl = part.image_url?.url;
        }
      }
    }

    // Fallback: check for base64 image data in response
    if (!imageUrl) {
      // Some GPT-4o responses return the image as a data URL directly in content
      const contentStr = data.choices?.[0]?.message?.content;
      if (typeof contentStr === 'string' && contentStr.startsWith('data:image')) {
        imageUrl = contentStr;
      }
    }

    if (!imageUrl) {
      throw new Error('OpenAI no devolvió una imagen');
    }

    return {
      imageUrl,
      seed: seed ?? request.seed,
      provider: 'openai',
      modelId: request.modelId,
      rawResponse: data,
    };
  }
}

/**
 * Gemini Nano Banana Pro provider (Gemini 3 Pro Image)
 */
export class GeminiProvider implements ImageGenerationProvider {
  readonly name = 'gemini';

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const model = getModelById(request.modelId);
    if (!model) throw new Error(`Unknown model: ${request.modelId}`);

    // Build the prompt with style instruction prefix for anime/manga
    let prompt = request.prompt;
    if (request.style === 'anime') {
      prompt = `[Anime style, vibrant colors, cel-shaded] ${prompt}`;
    } else if (request.style === 'manga') {
      prompt = `[Manga style, black and white or screentone, manga panel composition] ${prompt}`;
    } else if (request.style === 'vivid') {
      prompt = `[Vivid colors, high contrast, dramatic lighting] ${prompt}`;
    }

    // Gemini 3 Pro Image: uses generateContent with responseModalities: ['Image', 'Text']
    // This tells the model to return an image inline as base64 data
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                ...(request.negativePrompt
                  ? [{ text: `Avoid the following elements: ${request.negativePrompt}` }]
                  : []),
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['Image', 'Text'],
            candidateCount: 1,
            ...(request.quality === 'ultra' ? { resolution: 'high' } : {}),
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      throw new Error(err.error?.message || `Gemini error: ${response.status}`);
    }

    const data = await response.json();

    // Extract image from Gemini response (returns inline base64 data)
    let imageUrl: string | undefined;
    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/')) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('Gemini no devolvió una imagen');
    }

    return {
      imageUrl,
      provider: 'gemini',
      modelId: request.modelId,
      rawResponse: data,
    };
  }
}

// ============================================================================
// Provider Factory
// ============================================================================

/**
 * Get the appropriate provider instance
 */
export function getProvider(provider: ImageProvider): ImageGenerationProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get the provider for a given model ID
 */
export function getProviderForModel(modelId: string): ImageGenerationProvider {
  const model = getModelById(modelId);
  if (!model) throw new Error(`Unknown model: ${modelId}`);
  return getProvider(model.provider);
}
