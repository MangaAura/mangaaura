/**
 * POST /api/crowdsource/report
 *
 * API para crear reportes de calidad usando MongoDB.
 * Los usuarios pueden reportar errores, spoilers, problemas de calidad, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { QualityReportModel } from '@/infrastructure/persistence/mongodb/models/QualityReport';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-middleware';

// Schema de validación
const reportSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID es requerido'),
  issueType: z.union([
    z.literal('QUALITY'),
    z.literal('ERROR'),
    z.literal('SPOILER'),
    z.literal('OTHER'),
  ]),
  severity: z.union([
    z.literal('LOW'),
    z.literal('MEDIUM'),
    z.literal('HIGH'),
  ]),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000),
  // Opcionales
  pageNumber: z.number().int().positive().optional(),
  panelNumber: z.number().int().positive().optional(),
  coords: z.object({ x: z.number(), y: z.number() }).optional(),
});

// POST /api/crowdsource/report - Crear reporte
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión para reportar.' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'report');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const result = reportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { chapterId, issueType, severity, description, pageNumber, panelNumber } = result.data;

    await dbConnect();

    // Verificar que el usuario no haya reportado el mismo capítulo recientemente (anti-spam)
    const recentReport = await QualityReportModel.findOne({
      chapterId,
      reportedBy: session.user.id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (recentReport) {
      return NextResponse.json(
        {
          error: 'Ya has reportado este capítulo recientemente. Por favor espera 24 horas.',
        },
        { status: 429 }
      );
    }

    // Crear el reporte
    const report = await QualityReportModel.create({
      chapterId,
      reportedBy: session.user.id,
      issueType,
      severity,
      description,
      pageNumber,
      panelNumber,
      status: 'PENDING',
    });

    return NextResponse.json({
      success: true,
      message: 'Reporte creado exitosamente',
      report: {
        id: report._id.toString(),
        chapterId: report.chapterId,
        issueType: report.issueType,
        severity: report.severity,
        status: report.status,
        description: report.description,
        createdAt: report.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quality report:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/crowdsource/report - Obtener reportes del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const status = searchParams.get('status') as 'PENDING' | 'RESOLVED' | 'DISMISSED' | null;

    await dbConnect();

    // Construir query
    const query: any = {
      reportedBy: session.user.id,
    };

    if (chapterId) {
      query.chapterId = chapterId;
    }

    if (status) {
      query.status = status;
    }

    const reports = await QualityReportModel.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      reports: reports.map((r) => ({
        id: r._id.toString(),
        chapterId: r.chapterId,
        issueType: r.issueType,
        severity: r.severity,
        status: r.status,
        description: r.description,
        pageNumber: r.pageNumber,
        panelNumber: r.panelNumber,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        resolution: r.resolution,
      })),
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
