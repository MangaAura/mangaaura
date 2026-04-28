import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema para actualizar reporte
const updateReportSchema = z.object({
  action: z.enum(['ASSIGN', 'RESOLVE', 'DISMISS', 'ESCALATE']),
  resolution: z.string().max(1000).optional(),
});

// PATCH /api/reports/[id] - Actualizar un reporte (admin/moderator)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo admins y moderadores pueden gestionar reportes
    if (!['ADMIN', 'MODERATOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para gestionar reportes' },
        { status: 403 }
      );
    }

    const { id: reportId } = await params;
    const body = await request.json();
    const result = updateReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { action, resolution } = result.data;

    // Verificar que el reporte existe
    const report = await prisma.userReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: { select: { id: true, username: true } },
        reportedUser: { select: { id: true, username: true } },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Ejecutar acción
    let updatedReport;
    const now = new Date();

    switch (action) {
      case 'ASSIGN':
        // Asignar reporte al moderador actual
        updatedReport = await prisma.userReport.update({
          where: { id: reportId },
          data: {
            assignedTo: session.user.id,
            status: 'UNDER_REVIEW',
            updatedAt: now,
          },
          include: {
            assignedModerator: {
              select: { id: true, username: true, displayName: true },
            },
          },
        });
        break;

      case 'RESOLVE':
        // Resolver reporte
        if (!resolution) {
          return NextResponse.json(
            { error: 'Debes proporcionar una resolución' },
            { status: 400 }
          );
        }

        updatedReport = await prisma.userReport.update({
          where: { id: reportId },
          data: {
            status: 'RESOLVED',
            resolution,
            resolvedAt: now,
            updatedAt: now,
          },
        });

        // Notificar al reporter
        await prisma.notification.create({
          data: {
            userId: report.reporterId,
            type: 'REPORT_RESOLVED',
            title: 'Tu reporte ha sido resuelto',
            message: `El reporte #${reportId.slice(0, 8)} ha sido revisado y resuelto.`,
          },
        });
        break;

      case 'DISMISS':
        // Descartar reporte
        updatedReport = await prisma.userReport.update({
          where: { id: reportId },
          data: {
            status: 'DISMISSED',
            resolution: resolution || 'Reporte descartado tras revisión',
            resolvedAt: now,
            updatedAt: now,
          },
        });
        break;

      case 'ESCALATE':
        // Escalar a administrador (solo moderadores pueden escalar)
        if (session.user.role !== 'MODERATOR') {
          return NextResponse.json(
            { error: 'Solo moderadores pueden escalar reportes' },
            { status: 403 }
          );
        }

        updatedReport = await prisma.userReport.update({
          where: { id: reportId },
          data: {
            status: 'ESCALATED',
            resolution: resolution || 'Escalado a administrador',
            updatedAt: now,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

    // Log de auditoría de seguridad
    console.log(`[Security] Report ${action}: ${reportId} by ${session.user.id}`);

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Reporte ${action.toLowerCase()} correctamente`,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/reports/[id] - Obtener detalle de un reporte
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: reportId } = await params;

    // Usuarios normales solo pueden ver sus propios reportes
    // Admins/moderadores pueden ver todos
    const where: Record<string, unknown> = { id: reportId };

    if (!['ADMIN', 'MODERATOR'].includes(session.user.role || '')) {
      where.reporterId = session.user.id;
    }

    const report = await prisma.userReport.findFirst({
      where,
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
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
