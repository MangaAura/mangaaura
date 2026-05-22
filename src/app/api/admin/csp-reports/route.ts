import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
    const directive = url.searchParams.get('directive') || undefined;
    const disposition = url.searchParams.get('disposition') || undefined;
    const includeNoise = url.searchParams.get('includeNoise') === 'true';
    const startDate = url.searchParams.get('startDate') || undefined;
    const endDate = url.searchParams.get('endDate') || undefined;

    const where: Record<string, unknown> = {};

    if (!includeNoise) {
      where.isExtensionNoise = false;
    }
    if (directive) {
      where.violatedDirective = directive;
    }
    if (disposition) {
      where.disposition = disposition;
    }
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    const [reports, total, directiveCounts] = await Promise.all([
      prisma.cspReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          blockedUri: true,
          violatedDirective: true,
          documentUri: true,
          effectiveDirective: true,
          sourceFile: true,
          lineNumber: true,
          columnNumber: true,
          disposition: true,
          isExtensionNoise: true,
          createdAt: true,
        },
      }),
      prisma.cspReport.count({ where }),
      // Group by violated directive for summary
      prisma.cspReport.groupBy({
        by: ['violatedDirective'],
        where: { isExtensionNoise: false },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalReal: await prisma.cspReport.count({ where: { isExtensionNoise: false } }),
        totalNoise: await prisma.cspReport.count({ where: { isExtensionNoise: true } }),
        byDirective: directiveCounts.map((d: { violatedDirective: string; _count: { id: number } }) => ({
          directive: d.violatedDirective,
          count: d._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('[Admin CSP Reports] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
