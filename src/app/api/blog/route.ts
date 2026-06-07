import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// TODO: switch from newsArticle to a dedicated blogArticle model when blog data is separated
export async function GET() {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: { isPublished: true },
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        titleEn: true,
        excerptEn: true,
        coverUrl: true,
        category: true,
        isFeatured: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({
      articles: articles.map((a) => ({
        ...a,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching blog articles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
