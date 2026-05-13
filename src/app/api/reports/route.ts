import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const reportSchema = z.object({
  targetType: z.enum(['USER', 'MANGA', 'CHAPTER', 'COMMENT']),
  targetId: z.string(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'copyright', 'other']),
  description: z.string().max(1000).optional(),
});

// GET /api/reports - Get reports (admin/moderator only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check if user is admin or moderator
    if (!session?.user?.id || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;
    const priority = searchParams.get('priority') as string | null;
    const assignedTo = searchParams.get('assignedTo') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status) where.status = status.toUpperCase();
    if (priority) where.priority = priority.toUpperCase();
    if (assignedTo === 'me') {
      where.assignedTo = session.user.id;
    } else if (assignedTo === 'unassigned') {
      where.assignedTo = null;
    }

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          assignedModerator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error al cargar reportes' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { targetType, targetId, reason, description } = parsed.data;

    // Validate target exists and get info
    let reportedUserId: string | null = null;
    let reportedMangaId: string | null = null;
    let reportedChapterId: string | null = null;
    let reportedCommentId: string | null = null;

    switch (targetType) {
      case 'USER':
        const user = await prisma.user.findUnique({
          where: { id: targetId },
          select: { id: true },
        });
        if (!user) {
          return NextResponse.json(
            { error: 'Usuario no encontrado' },
            { status: 404 }
          );
        }
        reportedUserId = targetId;
        break;

      case 'MANGA':
        const manga = await prisma.mangaSeries.findUnique({
          where: { id: targetId },
          select: { id: true, authorId: true },
        });
        if (!manga) {
          return NextResponse.json(
            { error: 'Manga no encontrado' },
            { status: 404 }
          );
        }
        reportedMangaId = targetId;
        reportedUserId = manga.authorId;
        break;

      case 'CHAPTER':
        const chapter = await prisma.chapter.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            manga: { select: { authorId: true } },
          },
        });
        if (!chapter) {
          return NextResponse.json(
            { error: 'Capítulo no encontrado' },
            { status: 404 }
          );
        }
        reportedChapterId = targetId;
        reportedUserId = chapter.manga.authorId;
        break;

      case 'COMMENT':
        const comment = await prisma.comment.findUnique({
          where: { id: targetId },
          select: { id: true, userId: true },
        });
        if (!comment) {
          return NextResponse.json(
            { error: 'Comentario no encontrado' },
            { status: 404 }
          );
        }
        reportedCommentId = targetId;
        reportedUserId = comment.userId;
        break;
    }

    // Prevent self-reporting
    if (reportedUserId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes reportarte a ti mismo' },
        { status: 400 }
      );
    }

    // Check for duplicate reports (same user, same target within 24h)
    const recentReport = await prisma.userReport.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId,
        reportedMangaId,
        reportedChapterId,
        reportedCommentId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentReport) {
      return NextResponse.json(
        { error: 'Ya reportaste este contenido recientemente' },
        { status: 429 }
      );
    }

    // Determine priority based on report type
    let priority = 'MEDIUM';
    if (reason === 'copyright' || reason === 'harassment') {
      priority = 'HIGH';
    }

    const report = await prisma.userReport.create({
      data: {
        reporterId: session.user.id,
        reportedUserId,
        reportedMangaId,
        reportedChapterId,
        reportedCommentId,
        reportType: reason.toUpperCase(),
        reason: `${targetType}:${reason}`,
        description: description || null,
        status: 'PENDING',
        priority,
      },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    // Create notification for admins
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: 'REPORT_CREATED',
      title: 'Reporte enviado',
      message: `Tu reporte ha sido recibido y será revisado por el equipo.`,
      linkUrl: `/admin/moderation`,
    },
  });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}
