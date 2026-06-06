import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function checkAuth() {
  const session = await auth();
  if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
    return null;
  }
  return session;
}

// PATCH /api/admin/genres/[id] - Update a genre
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check slug uniqueness (excluding current genre)
    const existing = await prisma.genre.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A genre with this slug already exists' }, { status: 409 });
    }

    const genre = await prisma.genre.update({
      where: { id },
      data: { name, slug },
    });

    await invalidateCache('genres:list');

    return NextResponse.json({ genre });
  } catch (error) {
    console.error('Error updating genre:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/genres/[id] - Delete a genre
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const genre = await prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      return NextResponse.json({ error: 'Genre not found' }, { status: 404 });
    }

    await prisma.genre.delete({ where: { id } });
    await invalidateCache('genres:list');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting genre:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
