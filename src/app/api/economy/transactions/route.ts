import { NextRequest, NextResponse } from 'next/server';

import { ListTransactionsUseCase, ITransactionQueryRepository, TransactionRecord } from '@/application/use-cases/economy/ListTransactionsUseCase';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

class PrismaTransactionQueryRepository implements ITransactionQueryRepository {
  async findByUserId(
    userId: string,
    options: { skip: number; take: number; type?: string }
  ): Promise<TransactionRecord[]> {
    const where: { userId: string; type?: { in: string[] } } = {
      userId,
    };

    if (options.type === 'income') {
      where.type = {
        in: ['REGISTRATION_BONUS', 'CHAPTER_COMPLETE', 'COMMENT_POSTED', 'CORRECTION_APPROVED', 'ACHIEVEMENT_UNLOCKED', 'DAILY_STREAK', 'TIP_RECEIVED'],
      };
    } else if (options.type === 'expense') {
      where.type = {
        in: ['TIP_SENT', 'SPONSORSHIP_BID', 'CROWDFUND_CONTRIBUTE'],
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      skip: options.skip,
      take: options.take,
      orderBy: { timestamp: 'desc' },
    });

    return transactions.map((t: any) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: t.description,
      referenceId: t.referenceId,
      timestamp: t.timestamp,
    }));
  }

  async countByUserId(userId: string, type?: string): Promise<number> {
    const where: { userId: string; type?: { in: string[] } } = {
      userId,
    };

    if (type === 'income') {
      where.type = {
        in: ['REGISTRATION_BONUS', 'CHAPTER_COMPLETE', 'COMMENT_POSTED', 'CORRECTION_APPROVED', 'ACHIEVEMENT_UNLOCKED', 'DAILY_STREAK', 'TIP_RECEIVED'],
      };
    } else if (type === 'expense') {
      where.type = {
        in: ['TIP_SENT', 'SPONSORSHIP_BID', 'CROWDFUND_CONTRIBUTE'],
      };
    }

    return prisma.transaction.count({ where });
  }

  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { auraBalance: true },
    });
    return user?.auraBalance || 0;
  }
}

const listTransactionsUseCase = new ListTransactionsUseCase(
  new PrismaTransactionQueryRepository()
);

// GET /api/economy/transactions - Historial de transacciones
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
    const rlResult = await rateLimit(getRateLimitKey('economy-transactions', identifier), 30, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || undefined;

    const result = await listTransactionsUseCase.execute({
      userId: session.user.id,
      page,
      limit,
      type,
    });

    return NextResponse.json(result);
  } catch (error) {
    // console.error('Error obteniendo transacciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
