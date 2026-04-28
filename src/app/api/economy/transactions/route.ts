import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    const where: { userId: string; type?: { in: string[] } } = {
      userId: session.user.id,
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

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calcular balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { inkcoinsBalance: true },
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        referenceId: t.referenceId,
        timestamp: t.timestamp,
      })),
      balance: user?.inkcoinsBalance || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
