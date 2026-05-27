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
import { deleteFile } from '@/lib/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const COVER_WIDTH = 1500;
const COVER_HEIGHT = 500;
const COVER_QUALITY = 85;

const ALLOWED_TYPES = [
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/avif',
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

    const { allowed } = await rateLimit(
      getRateLimitKey('upload-profile-cover', session.user.id),
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
        { error: `Archivo demasiado grande. Máximo: 5MB (recibido: ${Math.round(file.size / 1024 / 1024)}MB)` },
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
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      quality: COVER_QUALITY,
      format: 'webp',
      fit: 'cover',
    });

    const timestamp = Date.now();
    const filename = `cover-${timestamp}.webp`;
    const pathname = `covers/${session.user.id}/${filename}`;

    const blob = await put(pathname, optimizedImage.buffer, {
      access: 'public',
      contentType: OUTPUT_CONTENT_TYPES['webp'],
      cacheControlMaxAge: 31536000,
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coverUrl: true },
    });

    if (user?.coverUrl) {
      try {
        await deleteFile(user.coverUrl);
      } catch {
        /* noop - continue even if old delete fails */
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        coverUrl: blob.url,
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
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en upload/profile-cover:', message);
    return NextResponse.json(
      { error: 'Error interno del servidor al subir el cover' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coverUrl: true },
    });

    if (!user?.coverUrl) {
      return NextResponse.json({ error: 'No hay cover para eliminar' }, { status: 404 });
    }

    try {
      await deleteFile(user.coverUrl);
    } catch {
      /* noop */
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { coverUrl: null, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error deleting profile cover:', message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}