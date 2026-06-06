/**
 * GET /api/ai/generate-image/models
 *
 * Returns the list of available image generation models with their
 * pricing and capabilities.
 */

import { NextResponse } from 'next/server';

import { IMAGE_MODELS } from '@/lib/ai-image-generation';

export async function GET() {
  const models = IMAGE_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    provider: m.provider,
    auraCost: m.auraCost,
    qualities: m.qualities,
    styles: m.styles,
    maxWidth: m.maxWidth,
    maxHeight: m.maxHeight,
    supportsNegativePrompt: m.supportsNegativePrompt,
    supportsSeed: m.supportsSeed,
  }));

  return NextResponse.json(models);
}
