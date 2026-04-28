import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const sponsorSchema = z.object({
  chapterId: z.string().min(1),
  bidAmount: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sponsorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { chapterId, bidAmount } = parsed.data;
    const userId = session.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.inkcoinsBalance < bidAmount) throw new Error('Insufficient InkCoins balance');

      const chapter = await tx.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter) throw new Error('Chapter not found');

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { inkcoinsBalance: user.inkcoinsBalance - bidAmount }
      });

      const bid = await tx.sponsorshipBid.create({
        data: { userId, chapterId, bidAmount, status: 'active' }
      });

      await tx.transaction.create({
        data: { userId, amount: -bidAmount, type: 'bid', referenceId: bid.id }
      });

      return { bid, remainingBalance: updatedUser.inkcoinsBalance };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Insufficient InkCoins balance' || error.message === 'Chapter not found') {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error('Error processing sponsor bid:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
