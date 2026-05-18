import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { validateImageFile, optimizeImageBuffer } from '@/lib/image-optimizer';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { uploadImage, validateFile as validateStorageFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session?.user?.id || 'anonymous';
    const { allowed } = await rateLimit(getRateLimitKey('upload', userId), 10, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const storageValidation = validateStorageFile(file);
    if (!storageValidation.valid) {
      return NextResponse.json(
        { error: storageValidation.error?.message || 'Archivo no válido' },
        { status: 400 }
      );
    }

    const fileId = randomUUID();

    let storagePath: string;
    switch (type) {
      case 'cover':
        storagePath = `covers`;
        break;
      case 'avatar':
        storagePath = `avatars`;
        break;
      case 'chapter':
        storagePath = `chapters/temp`;
        break;
      default:
        storagePath = 'general';
        break;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimized = await optimizeImageBuffer(buffer, {
      width: type === 'avatar' ? 400 : 1200,
      quality: type === 'cover' ? 90 : 85,
      format: 'webp',
    });

    const optimizedFile = new File(
      [new Uint8Array(optimized.buffer)],
      `${fileId}.webp`,
      { type: 'image/webp' }
    );

    const result = await uploadImage(optimizedFile, storagePath);

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.pathname,
      originalName: file.name,
      dimensions: {
        width: optimized.width,
        height: optimized.height,
      },
      size: optimized.size,
      format: optimized.format,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
