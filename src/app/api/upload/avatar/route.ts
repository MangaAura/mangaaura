import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import {
  optimizeImage,
  isValidImage,
  OUTPUT_CONTENT_TYPES,
  CACHE_CONTROL,
} from '@/lib/image-optimization';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const AVATAR_SIZE = 256;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para subir archivos.' },
        { status: 401 }
      );
    }

    const identifier = session.user.id;
    const { allowed } = await rateLimit(
      getRateLimitKey('upload-avatar', identifier),
      10,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'El campo file debe ser un archivo' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no válido. Permitidos: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande. Máximo: 2MB (recibido: ${Math.round(file.size / 1024 / 1024)}MB)` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validImage = await isValidImage(buffer);
    if (!validImage) {
      return NextResponse.json(
        { error: 'El archivo no es una imagen válida' },
        { status: 400 }
      );
    }

    const optimizedImage = await optimizeImage(buffer, {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      quality: 90,
      format: 'webp',
    });

    const timestamp = Date.now();
    const filename = `avatar-${timestamp}.webp`;
    const pathname = `avatars/${session.user.id}/${filename}`;

    const blob = await put(pathname, optimizedImage.buffer, {
      access: 'public',
      contentType: OUTPUT_CONTENT_TYPES['webp'],
      cacheControlMaxAge: 31536000,
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatarUrl: blob.url,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { url: blob.url },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL.immutable,
        },
      }
    );
  } catch (error) {
    console.error('Error en upload/avatar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al subir el avatar' },
      { status: 500 }
    );
  }
}
