import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { invalidateCache } from '@/lib/apiCache';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify genre exists
    const genre = await prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    // Delete genre (MangaGenre records cascade automatically)
    await prisma.genre.delete({ where: { id } });

    // Invalidate genre cache
    await invalidateCache('genres:list');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
