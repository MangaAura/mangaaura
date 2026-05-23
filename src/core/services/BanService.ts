import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security-audit';
import type { BanType } from '@/generated/prisma/client';

export type { BanType };

export interface CreateBanInput {
  userId?: string;
  banType: BanType;
  reason: string;
  reasonDetail?: string;
  ipAddress?: string;
  expiresAt?: Date;
  issuedById: string;
}

export interface BanResult {
  id: string;
  userId: string | null;
  banType: BanType;
  reason: string;
  reasonDetail: string | null;
  ipAddress: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  issuedById: string;
  issuedAt: Date;
  liftedById: string | null;
  liftedAt: Date | null;
  liftReason: string | null;
}

export async function createBan(input: CreateBanInput): Promise<BanResult> {
  if (input.banType === 'SUSPENSION' && !input.expiresAt) {
    throw new Error('SUSPENSION ban requires an expiry date');
  }

  const ban = await prisma.banRecord.create({
    data: {
      userId: input.userId ?? null,
      banType: input.banType,
      reason: input.reason,
      reasonDetail: input.reasonDetail ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: input.expiresAt ?? null,
      issuedById: input.issuedById,
    },
  });

  if (input.userId) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { role: 'BANNED' },
    });
  }

  await logSecurityEvent({
    userId: input.issuedById,
    action: 'USER_BANNED',
    targetId: input.userId,
    targetType: 'USER',
    metadata: {
      banType: input.banType,
      reason: input.reason,
      reasonDetail: input.reasonDetail,
      ipAddress: input.ipAddress,
      expiresAt: input.expiresAt?.toISOString(),
    },
    severity: input.banType === 'PERMANENT' ? 'CRITICAL' : 'WARNING',
  });

  return ban;
}

export async function liftBan(banId: string, liftedById: string, liftReason?: string): Promise<BanResult> {
  const ban = await prisma.banRecord.update({
    where: { id: banId },
    data: {
      isActive: false,
      liftedById,
      liftedAt: new Date(),
      liftReason: liftReason ?? null,
    },
  });

  if (ban.userId) {
    const otherActiveBans = await prisma.banRecord.count({
      where: {
        userId: ban.userId,
        id: { not: banId },
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (otherActiveBans === 0) {
      await prisma.user.update({
        where: { id: ban.userId },
        data: { role: 'USER' },
      });
    }
  }

  await logSecurityEvent({
    userId: liftedById,
    action: 'USER_UNBANNED',
    targetId: ban.userId ?? undefined,
    targetType: 'USER',
    metadata: { banId, liftReason },
    severity: 'INFO',
  });

  return ban;
}

export async function getActiveBans(userId: string) {
  return prisma.banRecord.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { issuedAt: 'desc' },
    include: {
      issuedBy: { select: { id: true, username: true } },
      liftedBy: { select: { id: true, username: true } },
    },
  });
}

export async function isUserBanned(userId: string): Promise<{ banned: boolean; ban?: BanResult & { issuedBy?: { id: string; username: string } } }> {
  const activeBan = await prisma.banRecord.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { issuedAt: 'desc' },
    include: {
      issuedBy: { select: { id: true, username: true } },
    },
  });

  if (!activeBan) {
    return { banned: false };
  }

  return { banned: true, ban: activeBan };
}

export async function getIPBan(ipAddress: string) {
  return prisma.banRecord.findFirst({
    where: {
      banType: 'IP_BAN',
      ipAddress,
      isActive: true,
    },
  });
}

export async function bulkCreateBan(inputs: CreateBanInput[]): Promise<BanResult[]> {
  const results: BanResult[] = [];
  for (const input of inputs) {
    const ban = await createBan(input);
    results.push(ban);
  }
  return results;
}
