import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const transactionSchema = z.object({
  amount: z.number().int(),
  type: z.string().min(1).max(50),
  referenceId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('gamification-transaction', identifier), 30, 60);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const body = await request.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { amount, type, referenceId } = parsed.data;
    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      if (amount < 0 && user.inkcoinsBalance < Math.abs(amount)) {
        throw new Error('Insufficient InkCoins balance');
      }

      const newBalance = user.inkcoinsBalance + amount;

      const transaction = await tx.transaction.create({
        data: { userId, amount, type, referenceId }
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { inkcoinsBalance: newBalance }
      });

      return { transaction, balance: updatedUser.inkcoinsBalance };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Insufficient InkCoins balance') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Error processing transaction:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
