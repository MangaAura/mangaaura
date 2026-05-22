import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { autoTranslateNewsArticle } from '@/lib/translate';

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  excerpt: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  titleEn: z.string().max(200).optional().nullable(),
  excerptEn: z.string().max(500).optional().nullable(),
  contentEn: z.string().optional().nullable(),
  coverUrl: z.string().url('URL de portada inválida').nullable().optional(),
  category: z.enum(['platform', 'community', 'tools', 'mobile', 'contest']).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const article = await prisma.newsArticle.findUnique({
      where: { id },
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

    if (!article) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      article: {
        ...article,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching news article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { allowed } = await rateLimit(getRateLimitKey('admin-news-update', userId), 30, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    const data = result.data;
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) {
      // Check slug uniqueness (exclude current article)
      const slugExists = await prisma.newsArticle.findFirst({
        where: { slug: data.slug, id: { not: id } },
      });
      if (slugExists) {
        return NextResponse.json({ error: 'El slug ya está en uso' }, { status: 409 });
      }
      updateData.slug = data.slug;
    }
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    // Si cambiaron campos en español y no se proveyeron traducciones, auto-traducir
    const spanishFieldsChanged =
      data.title !== undefined || data.excerpt !== undefined || data.content !== undefined;
    const englishFieldsProvided =
      data.titleEn !== undefined || data.excerptEn !== undefined || data.contentEn !== undefined;

    if (spanishFieldsChanged && !englishFieldsProvided) {
      // Force re-translation only for fields whose Spanish actually changed
      const effectiveData = {
        title: data.title ?? existing.title,
        excerpt: data.excerpt ?? existing.excerpt,
        content: data.content ?? existing.content,
        titleEn: data.title !== undefined ? null : existing.titleEn,
        excerptEn: data.excerpt !== undefined ? null : existing.excerptEn,
        contentEn: data.content !== undefined ? null : existing.contentEn,
      };

      const translation = await autoTranslateNewsArticle(effectiveData).catch((err) => {
        console.warn('Auto-translation failed, continuing without it:', err.message);
        return null;
      });

      if (translation) {
        if (translation.titleEn !== null) updateData.titleEn = translation.titleEn;
        if (translation.excerptEn !== null) updateData.excerptEn = translation.excerptEn;
        if (translation.contentEn !== null) updateData.contentEn = translation.contentEn;
      }
    }

    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
    if (data.excerptEn !== undefined) updateData.excerptEn = data.excerptEn;
    if (data.contentEn !== undefined) updateData.contentEn = data.contentEn;
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    // Handle publishing/unpublishing
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      if (data.isPublished && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (!data.isPublished) {
        updateData.publishedAt = null;
      }
    }

    const article = await prisma.newsArticle.update({
      where: { id },
      data: updateData,
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
      article: {
        ...article,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error updating news:', error);
    const message = error?.message || 'Internal server error';
    const status = message === 'Noticia no encontrada' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { allowed } = await rateLimit(getRateLimitKey('admin-news-delete', userId), 20, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    await prisma.newsArticle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting news:', error);
    const message = error?.message || 'Internal server error';
    const status = message === 'Noticia no encontrada' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
