import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { autoTranslateNewsArticle } from '@/lib/translate';

const createSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  excerpt: z.string().min(1, 'El extracto es requerido').max(500),
  content: z.string().min(1, 'El contenido es requerido'),
  titleEn: z.string().max(200).optional().nullable(),
  excerptEn: z.string().max(500).optional().nullable(),
  contentEn: z.string().optional().nullable(),
  coverUrl: z.string().url('URL de portada inválida').nullable().optional(),
  category: z.enum(['platform', 'community', 'tools', 'mobile', 'contest']).default('platform'),
  isPublished: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const articles = await prisma.newsArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      articles: articles.map((a) => ({
        ...a,
        publishedAt: a.publishedAt?.toISOString() ?? null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { allowed } = await rateLimit(getRateLimitKey('admin-news-create', userId), 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = createSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    let slug = data.slug;

    // Check slug uniqueness and generate unique slug if needed
    const existingSlug = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Auto-traducir campos vacíos al inglés
    const translation = await autoTranslateNewsArticle({
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      titleEn: data.titleEn,
      excerptEn: data.excerptEn,
      contentEn: data.contentEn,
    }).catch((err) => {
      console.warn('Auto-translation failed, continuing without it:', err.message);
      return null;
    });

    const article = await prisma.newsArticle.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        titleEn: translation?.titleEn ?? data.titleEn ?? null,
        excerptEn: translation?.excerptEn ?? data.excerptEn ?? null,
        contentEn: translation?.contentEn ?? data.contentEn ?? null,
        coverUrl: data.coverUrl ?? null,
        category: data.category,
        authorId: userId,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        article: {
          ...article,
          publishedAt: article.publishedAt?.toISOString() ?? null,
          createdAt: article.createdAt.toISOString(),
          updatedAt: article.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating news:', error);
    const message = error?.message || 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
