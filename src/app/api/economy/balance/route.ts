import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { paymentService } from '@/infrastructure/adapters/paymentService';
import { GetBalanceUseCase, IUserBalanceRepository } from '@/application/use-cases/economy/GetBalanceUseCase';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

class PrismaUserBalanceRepository implements IUserBalanceRepository {
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        xpPoints: true,
        level: true,
      },
    });
    if (!user) return null;
    const xpLevel = Math.floor(user.xpPoints / 1000) + 1;
    const progress = user.xpPoints % 1000;
    return {
      id: user.id,
      xp: {
        amount: user.xpPoints,
        level: xpLevel,
        rank: xpLevel >= 50 ? 'Legendario' : xpLevel >= 30 ? 'Élite' : xpLevel >= 20 ? 'Maestro' : xpLevel >= 10 ? 'Avanzado' : xpLevel >= 5 ? 'Intermedio' : 'Principiante',
        progressToNextLevel: Math.round((progress / 1000) * 100),
      },
    };
  }
}

const getBalanceUseCase = new GetBalanceUseCase(
  new PrismaUserBalanceRepository(),
  paymentService
);

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

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('economy-balance', identifier), 60, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const result = await getBalanceUseCase.execute({
      userId: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    // console.error('Error obteniendo balance:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
