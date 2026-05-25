import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';
import { sanitizeText } from '@/lib/sanitize';

// Schema para DMCA takedown request
const dmcaSchema = z.object({
  requesterName: z.string().min(2).max(100),
  requesterEmail: z.string().email(),
  requesterAddress: z.string().min(10).max(500),
  infringingMangaId: z.string().uuid().optional(),
  infringingChapterId: z.string().uuid().optional(),
  originalWorkUrl: z.string().url().optional(),
  originalWorkDescription: z.string().min(10).max(1000),
  goodFaithStatement: z.literal(true),
  signature: z.string().min(2).max(100),
});

// POST /api/dmca - Submit DMCA takedown request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rlResponse = await withRateLimit(request, undefined, 'dmca');
    if (rlResponse) return rlResponse;

    const result = dmcaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      requesterName,
      requesterEmail,
      requesterAddress,
      infringingMangaId,
      infringingChapterId,
      originalWorkUrl,
      originalWorkDescription,
      signature,
    } = result.data;

    // Verificar que al menos un contenido infractor está especificado
    if (!infringingMangaId && !infringingChapterId) {
      return NextResponse.json(
        { error: 'Debes especificar el contenido infractor (manga o capítulo)' },
        { status: 400 }
      );
    }

    // Verificar rate limiting (1 DMCA cada 24 horas por IP)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentDMCAs = await prisma.dMCATakedown.count({
      where: {
        requesterEmail: requesterEmail.toLowerCase(),
        submittedAt: { gte: oneDayAgo },
      },
    });

    if (recentDMCAs >= 3) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes DMCA. Espera 24 horas antes de enviar otra.' },
        { status: 429 }
      );
    }

    // Verificar que el contenido existe
    if (infringingMangaId) {
      const manga = await prisma.mangaSeries.findUnique({
        where: { id: infringingMangaId },
        select: { id: true, title: true },
      });
      if (!manga) {
        return NextResponse.json(
          { error: 'Manga no encontrado' },
          { status: 404 }
        );
      }
    }

    if (infringingChapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: infringingChapterId },
        select: { id: true, title: true },
      });
      if (!chapter) {
        return NextResponse.json(
          { error: 'Capítulo no encontrado' },
          { status: 404 }
        );
      }
    }

    // Crear DMCA request
    const dmca = await prisma.dMCATakedown.create({
      data: {
        requesterName: sanitizeText(requesterName),
        requesterEmail: requesterEmail.toLowerCase(),
        requesterAddress: sanitizeText(requesterAddress),
        infringingContentId: infringingMangaId || infringingChapterId,
        infringingContentType: infringingMangaId ? 'MANGA' : 'CHAPTER',
        originalWorkUrl,
        originalWorkDescription: sanitizeText(originalWorkDescription),
        goodFaithStatement: true,
        signature: sanitizeText(signature),
        status: 'PENDING',
      },
    });

    // Notificar a administradores
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'DMCA_REQUEST',
          title: 'Nueva solicitud DMCA',
          message: `${requesterName} ha reportado contenido infractor. Revisión requerida.`,
        },
      });
    }

  return NextResponse.json({
      success: true,
      dmca: {
        id: dmca.id,
        status: dmca.status,
        submittedAt: dmca.submittedAt,
      },
      message: 'Solicitud DMCA recibida. Será revisada por nuestro equipo legal en un plazo de 48 horas.',
    });
  } catch (error) {
    console.error('Error submitting DMCA:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/dmca - List DMCA requests (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [dmcas, total] = await Promise.all([
      prisma.dMCATakedown.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.dMCATakedown.count({ where }),
    ]);

    // Estadísticas
    const stats = await prisma.dMCATakedown.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return NextResponse.json({
      dmcas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc: any, s: any) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching DMCAs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
