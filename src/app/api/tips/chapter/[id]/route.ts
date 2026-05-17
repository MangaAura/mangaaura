import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/infrastructure/adapters/paymentService';

// GET /api/tips/chapter/[id] - Obtener propinas de un capítulo
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: chapterId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const tips = await paymentService.getChapterTips(chapterId);

    return NextResponse.json({
      tips,
      count: tips.length,
      totalAmount: tips.reduce((sum, tip) => sum + tip.amount, 0),
    });
  } catch (error) {
    console.error('Error obteniendo propinas del capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
