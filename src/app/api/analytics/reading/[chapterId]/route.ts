/**
 * GET /api/analytics/reading/[chapterId]
 *
 * API para obtener estadísticas de lectura de un capítulo desde MongoDB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readingAnalyticsService } from '@/core/services/ReadingAnalyticsService';

// GET /api/analytics/reading/[chapterId] - Obtener estadísticas de lectura
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { chapterId } = await params;

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Se requiere chapterId' },
        { status: 400 }
      );
    }

    const stats = await readingAnalyticsService.getReadingStats(chapterId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
