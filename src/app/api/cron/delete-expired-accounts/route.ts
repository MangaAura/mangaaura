import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// POST /api/cron/delete-expired-accounts - Delete accounts marked for deletion
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    if (!authHeader || !expectedAuth || authHeader.length !== expectedAuth.length || !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedAuth))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const expiredUsers = await prisma.user.findMany({
      where: {
        markedForDeletionAt: {
          lte: now,
        },
      },
      select: { id: true, email: true, username: true },
    });

    if (expiredUsers.length === 0) {
      return NextResponse.json({ deleted: 0, users: [] });
    }

    const userIds = expiredUsers.map((u) => u.id);

    await prisma.$transaction(async (tx) => {
      // Relations without cascade on userId (must be deleted explicitly)
      await tx.loginAttempt.deleteMany({ where: { userId: { in: userIds } } });
      await tx.consentRecord.deleteMany({ where: { userId: { in: userIds } } });

      // BanRecord (userId, issuedById, liftedById) - no cascade
      await tx.banRecord.deleteMany({ where: { userId: { in: userIds } } });
      await tx.banRecord.deleteMany({ where: { issuedById: { in: userIds } } });
      await tx.banRecord.deleteMany({ where: { liftedById: { in: userIds } } });

      // Relations with onDelete: SetNull - set to null before deleting user
      await tx.contactMessage.updateMany({
        where: { userId: { in: userIds } },
        data: { userId: null },
      });
      await tx.event.updateMany({
        where: { createdBy: { in: userIds } },
        data: { createdBy: null },
      });
      await tx.userReport.updateMany({
        where: { assignedTo: { in: userIds } },
        data: { assignedTo: null },
      });

      // Clan leader - set to null (leaderId is unique, so only one clan per leader)
      await tx.clan.updateMany({
        where: { leaderId: { in: userIds } },
        data: { leaderId: null },
      });

      // InboundEmail - userId is a plain field, not a relation
      await tx.inboundEmail.updateMany({
        where: { userId: { in: userIds } },
        data: { userId: null },
      });

      // Delete users (cascades will handle most relations automatically)
      await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });
    });

    return NextResponse.json({
      deleted: expiredUsers.length,
      users: expiredUsers.map((u) => ({ id: u.id, email: u.email, username: u.username })),
    });
  } catch (error) {
    console.error('[CRON] Error deleting expired accounts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
