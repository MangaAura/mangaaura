import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createToken(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64UrlEncode(JSON.stringify(header));
  const payloadStr = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64url');
  return `${headerStr}.${payloadStr}.${signature}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await requirePermission(session.user.id, 'admin:impersonate');
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

const jwtSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
if (!jwtSecret) {
  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
}
const now = Math.floor(Date.now() / 1000);

    const token = createToken(
      {
        sub: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        impersonatedBy: session.user.id,
        type: 'impersonation',
        iat: now,
        exp: now + 3600,
      },
      jwtSecret
    );

    await prisma.securityAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'IMPERSONATE_USER',
        targetId: targetUser.id,
        targetType: 'USER',
        metadata: JSON.stringify({ impersonatedUsername: targetUser.username }),
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        severity: 'CRITICAL',
      },
    });

    return NextResponse.json({
      token,
      redirectUrl: `/api/auth/callback/impersonate?token=${token}`,
    });
  } catch (error) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
