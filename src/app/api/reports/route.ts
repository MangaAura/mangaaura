import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para crear reporte
const createReportSchema = z.object({
  reportType: z.enum([
    'HARASSMENT',
    'SPAM',
    'INAPPROPRIATE_CONTENT',
    'COPYRIGHT_VIOLATION',
    'IMPERSONATION',
    'HATE_SPEECH',
    'VIOLENCE',
    'SCAM',
    'OTHER',
  ]),
  reason: z.string().min(10).max(500),
  description: z.string().max(2000).optional(),
  evidenceUrl: z.string().url().optional(),
  // Uno de estos debe estar presente
  reportedUserId: z.string().uuid().optional(),
  reportedMangaId: z.string().uuid().optional(),
  reportedChapterId: z.string().uuid().optional(),
  reportedCommentId: z.string().uuid().optional(),
});

// POST /api/reports - Crear un reporte
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      reportType,
      reason,
      description,
      evidenceUrl,
      reportedUserId,
      reportedMangaId,
      reportedChapterId,
      reportedCommentId,
    } = result.data;

    // Verificar que al menos un target está presente
    if (!reportedUserId && !reportedMangaId && !reportedChapterId && !reportedCommentId) {
      return NextResponse.json(
        { error: 'Debes especificar qué estás reportando' },
        { status: 400 }
      );
    }

    // Verificar rate limiting (1 reporte cada 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentReports = await prisma.userReport.count({
      where: {
        reporterId: session.user.id,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentReports >= 3) {
      return NextResponse.json(
        { error: 'Demasiados reportes. Espera 5 minutos antes de reportar de nuevo.' },
        { status: 429 }
      );
    }

    // Determinar prioridad automáticamente
    let priority = 'MEDIUM';
    if (reportType === 'VIOLENCE' || reportType === 'COPYRIGHT_VIOLATION') {
      priority = 'CRITICAL';
    } else if (reportType === 'HARASSMENT' || reportType === 'HATE_SPEECH') {
      priority = 'HIGH';
    }

    // Crear reporte
    const report = await prisma.userReport.create({
      data: {
        reporterId: session.user.id,
        reportedUserId,
        reportedMangaId,
        reportedChapterId,
        reportedCommentId,
        reportType,
        reason,
        description,
        evidenceUrl,
        priority,
        status: 'PENDING',
      },
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true },
        },
        reportedUser: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    // Log de seguridad
    console.log(`[Security] Report created: ${report.id} by ${session.user.id}`);

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        priority: report.priority,
        createdAt: report.createdAt,
      },
      message: 'Reporte enviado correctamente. Será revisado por nuestro equipo.',
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/reports - Listar reportes del usuario (admin/moderator)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo admins y moderadores pueden ver todos los reportes
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver reportes' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (assignedTo === 'me') {
      where.assignedTo = session.user.id;
    } else if (assignedTo === 'unassigned') {
      where.assignedTo = null;
    }

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          reporter: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          reportedUser: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          assignedModerator: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      prisma.userReport.count({ where }),
    ]);

    // Estadísticas
    const stats = await prisma.userReport.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
