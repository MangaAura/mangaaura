import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/core/services/PaymentService';

// GET /api/economy/balance - Obtener balance actual del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const [balance, tipStats, crowdfundingStats] = await Promise.all([
      paymentService.getUserBalance(session.user.id),
      paymentService.getUserTipStats(session.user.id),
      paymentService.getUserCrowdfundingStats(session.user.id),
    ]);

    return NextResponse.json({
      balance,
      stats: {
        tips: tipStats,
        crowdfunding: crowdfundingStats,
      },
    });
  } catch (error) {
    console.error('Error obteniendo balance:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
