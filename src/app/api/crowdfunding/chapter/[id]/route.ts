import { NextRequest, NextResponse } from 'next/server';

import { paymentService } from '@/infrastructure/adapters/paymentService';
import { auth } from '@/lib/auth';

// GET /api/crowdfunding/chapter/[id] - Obtener estado del crowdfunding de un capítulo
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

    const [status, contributors, userContribution] = await Promise.all([
      paymentService.getChapterCrowdfunding(chapterId),
      paymentService.getChapterContributors(chapterId),
      paymentService.getUserContribution(chapterId, session.user.id),
    ]);

    return NextResponse.json({
      status,
      contributors: contributors.map((c: any) => ({
        ...c,
        user: c.isAnonymous ? null : c.user,
      })),
      userContribution,
    });
  } catch (error) {
    console.error('Error obteniendo crowdfunding del capítulo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
