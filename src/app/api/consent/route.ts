import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { type, version } = body;

    if (!type || !version) {
      return NextResponse.json({ error: 'type and version are required' }, { status: 400 });
    }

    const data: any = {
      type,
      version,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
    };

    if (session?.user?.id) {
      data.userId = session.user.id;
    }

    const record = await prisma.consentRecord.create({ data });

    return NextResponse.json({ success: true, id: record.id }, { status: 201 });
  } catch (error) {
    console.error('Consent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
