import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin/genres - Create a new genre
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.genre.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A genre with this slug already exists' }, { status: 409 });
    }

    const genre = await prisma.genre.create({
      data: { name, slug },
    });

    await invalidateCache('genres:list');

    return NextResponse.json({ genre }, { status: 201 });
  } catch (error) {
    console.error('Error creating genre:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
