import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  resolution: z.string().max(1000).optional(),
});

// GET /api/reports/[id] - Get report details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const report = await prisma.userReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
            role: true,
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
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Get target info
    let targetInfo = null;
    if (report.reportedMangaId) {
      targetInfo = await prisma.mangaSeries.findUnique({
        where: { id: report.reportedMangaId },
        select: { id: true, title: true, slug: true, coverUrl: true },
      });
    } else if (report.reportedChapterId) {
      targetInfo = await prisma.chapter.findUnique({
        where: { id: report.reportedChapterId },
        select: {
          id: true,
          title: true,
          chapterNumber: true,
          manga: { select: { title: true, slug: true } },
        },
      });
    } else if (report.reportedCommentId) {
      targetInfo = await prisma.comment.findUnique({
        where: { id: report.reportedCommentId },
        select: { id: true, content: true, createdAt: true },
      });
    }

    // Get reporter's history
    const reporterHistory = await prisma.userReport.findMany({
      where: { reporterId: report.reporterId },
      select: { status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get reported user's history
    const reportedUserHistory = report.reportedUserId
      ? await prisma.userReport.findMany({
          where: { reportedUserId: report.reportedUserId },
          select: { status: true, priority: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : [];

    return NextResponse.json({
      report,
      targetInfo,
      reporterHistory: {
        total: reporterHistory.length,
        validated: reporterHistory.filter((r: any) => r.status === 'RESOLVED').length,
      },
      reportedUserHistory: {
        total: reportedUserHistory.length,
        highPriority: reportedUserHistory.filter((r: any) => r.priority === 'HIGH' || r.priority === 'CRITICAL').length,
      },
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Error al cargar reporte' },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - Update report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const report = await prisma.userReport.findUnique({
      where: { id },
      select: {
        id: true,
        reporterId: true,
        status: true,
        assignedTo: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { status, priority, resolution } = parsed.data;

    // Auto-assign on first action if not assigned
    const shouldAssign = !report.assignedTo;

    const updated = await prisma.userReport.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(resolution !== undefined && { resolution: resolution || null }),
        ...(shouldAssign && { assignedTo: session.user.id }),
        ...(status === 'RESOLVED' || status === 'DISMISSED'
          ? { resolvedAt: new Date() }
          : {}),
      },
      include: {
        reporter: {
          select: { id: true, username: true },
        },
        reportedUser: {
          select: { id: true, username: true },
        },
      },
    });

    // Notify reporter of resolution
    if (status === 'RESOLVED' || status === 'DISMISSED') {
    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        type: 'REPORT_RESOLVED',
        title: 'Reporte resuelto',
        message: `Tu reporte ha sido ${status === 'RESOLVED' ? 'validado' : 'rechazado'}.`,
        linkUrl: '/reports/history',
      },
    });
    }

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reporte' },
      { status: 500 }
    );
  }
}
