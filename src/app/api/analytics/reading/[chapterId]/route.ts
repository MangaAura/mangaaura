import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readingAnalyticsService } from '@/core/services/ReadingAnalyticsService';

export async function GET(
  _request: NextRequest,
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

    if (!readingAnalyticsService) {
      return NextResponse.json(
        { error: 'Servicio no inicializado' },
        { status: 500 }
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
