import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '24')));
    const sort = searchParams.get('sort') || 'latest'; // latest | popular
    const searchQuery = searchParams.get('search') || '';

    const orderBy = sort === 'popular'
      ? [{ likeCount: 'desc' as const }, { createdAt: 'desc' as const }]
      : [{ createdAt: 'desc' as const }];

    const where: any = {
      status: 'COMPLETED',
      isPublic: true,
      imageUrl: { not: null },
    };

    if (searchQuery.trim()) {
      where.prompt = { contains: searchQuery.trim(), mode: 'insensitive' };
    }

    const [images, total] = await Promise.all([
      prisma.imageGeneration.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          prompt: true,
          imageUrl: true,
          thumbnailUrl: true,
          width: true,
          height: true,
          provider: true,
          modelId: true,
          style: true,
          quality: true,
          likeCount: true,
          commentCount: true,
          createdAt: true,
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.imageGeneration.count({
        where: { status: 'COMPLETED', isPublic: true, imageUrl: { not: null } },
      }),
    ]);

    // Check which images the current user has liked
    const session = await auth();
    let userLikes: Set<string> = new Set();
    if (session?.user?.id) {
      const ids = images.map((i) => i.id);
      if (ids.length > 0) {
        const likes = await prisma.imageGenerationLike.findMany({
          where: { userId: session.user.id, imageId: { in: ids } },
          select: { imageId: true },
        });
        userLikes = new Set(likes.map((l) => l.imageId));
      }
    }

    const items = images.map((img) => ({
      ...img,
      isLikedByUser: userLikes.has(img.id),
    }));

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Gallery Public] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
