/**
 * GET /api/crowdsource/reports
 *
 * API para listar reportes (solo para admins/moderadores).
 * Permite filtrar y obtener estadísticas de reportes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { QualityReportModel } from '@/infrastructure/persistence/mongodb/models/QualityReport';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';

// Query schema
const querySchema = z.object({
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  issueType: z.enum(['QUALITY', 'ERROR', 'SPOILER', 'OTHER']).optional(),
  chapterId: z.string().optional(),
  limit: z.string().transform((v: any) => parseInt(v) || 20).optional(),
  offset: z.string().transform((v: any) => parseInt(v) || 0).optional(),
  sortBy: z.enum(['createdAt', 'severity', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/crowdsource/reports - Listar reportes (admin/moderador)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario es admin o moderador
    // Aquí deberías verificar el rol del usuario
    // Por ahora, solo permitimos acceso si tiene session
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'MODERATOR';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta información' },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      issueType: searchParams.get('issueType') || undefined,
      chapterId: searchParams.get('chapterId') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: queryResult.error.flatten() },
        { status: 400 }
      );
    }

    const { status, severity, issueType, chapterId, limit, offset, sortBy, sortOrder } = queryResult.data;

    await dbConnect();

    // Construir query
    const query: any = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (issueType) query.issueType = issueType;
    if (chapterId) query.chapterId = chapterId;

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar queries en paralelo
    const [reports, total, stats] = await Promise.all([
      QualityReportModel.find(query)
        .sort(sort)
        .skip(offset || 0)
        .limit(limit || 20)
        .lean(),
      QualityReportModel.countDocuments(query),
      // Estadísticas de reportes
      QualityReportModel.aggregate([
        {
          $group: {
            _id: null,
            totalPending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            totalResolved: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
            totalDismissed: { $sum: { $cond: [{ $eq: ['$status', 'DISMISSED'] }, 1, 0] } },
            highSeverity: { $sum: { $cond: [{ $eq: ['$severity', 'HIGH'] }, 1, 0] } },
            mediumSeverity: { $sum: { $cond: [{ $eq: ['$severity', 'MEDIUM'] }, 1, 0] } },
            lowSeverity: { $sum: { $cond: [{ $eq: ['$severity', 'LOW'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const statsData = stats[0] || {
      totalPending: 0,
      totalResolved: 0,
      totalDismissed: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
    };

    return NextResponse.json({
      success: true,
      reports: reports.map((r: any) => ({
        id: r._id.toString(),
        chapterId: r.chapterId,
        reportedBy: r.reportedBy,
        issueType: r.issueType,
        severity: r.severity,
        description: r.description,
        status: r.status,
        pageNumber: r.pageNumber,
        panelNumber: r.panelNumber,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        resolvedBy: r.resolvedBy,
        resolution: r.resolution,
      })),
      pagination: {
        total,
        limit: limit || 20,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || 20) < total,
      },
      stats: {
        total,
        byStatus: {
          pending: statsData.totalPending,
          resolved: statsData.totalResolved,
          dismissed: statsData.totalDismissed,
        },
        bySeverity: {
          high: statsData.highSeverity,
          medium: statsData.mediumSeverity,
          low: statsData.lowSeverity,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
