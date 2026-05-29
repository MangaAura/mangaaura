import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/lib/apiCache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Check if manga is soft-deleted (in MangaSeries with deletedAt set)
    const softDeletedManga = await prisma.mangaSeries.findUnique({
      where: { id },
      select: { authorId: true, title: true, deletedAt: true },
    });

    if (softDeletedManga?.deletedAt) {
      // Handle soft-deleted manga: just clear deletedAt
      if (softDeletedManga.authorId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No tienes permiso para restaurar este manga' }, { status: 403 });
      }

      await prisma.mangaSeries.update({
        where: { id },
        data: { deletedAt: null, restoredAt: new Date() },
      });

      await invalidateCache(`manga:${id}`);
      await invalidateCache('manga:list');
      await invalidateCache('user:mangas:list');

      return NextResponse.json({
        message: `Manga "${softDeletedManga.title}" restaurado exitosamente`,
        restored: true,
      });
    }

    // Otherwise, try to restore from bundle
    const bundle = await prisma.deletedMangaBundle.findUnique({
      where: { id },
    });

    if (!bundle) {
      return NextResponse.json({ error: 'Manga no encontrado en la papelera' }, { status: 404 });
    }

    if (bundle.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No tienes permiso para restaurar este manga' }, { status: 403 });
    }

    // Parsear el bundle
    const data = JSON.parse(bundle.data) as {
      manga: Record<string, unknown> & {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        coverUrl: string | null;
        authorId: string;
        authorName: string;
        status: string;
        tags: string;
        totalViews: number;
        rating: number | null;
        createdAt: Date;
        updatedAt: Date;
        chapters?: Array<Record<string, unknown> & {
          id: string;
          mangaId: string;
          chapterNumber: number;
          title: string | null;
          totalPages: number;
          pageUrls: string;
          crowdfundingGoal: number | null;
          crowdfundingCurrent: number;
          isCrowdfunded: boolean;
          viewCount: number;
          status: string;
          scheduledAt: Date | null;
          createdAt: Date;
          updatedAt: Date;
          comments?: Array<Record<string, unknown> & {
            id: string;
            chapterId: string;
            userId: string;
            content: string;
            parentId: string | null;
            likesCount: number;
            isDeleted: boolean;
            isHidden: boolean;
            hiddenReason: string | null;
            createdAt: Date;
            updatedAt: Date;
            likes?: Array<Record<string, unknown>>;
            mentions?: Array<Record<string, unknown>>;
          }>;
          tips?: Array<Record<string, unknown>>;
          crowdfundingContributions?: Array<Record<string, unknown>>;
          sponsorshipBids?: Array<Record<string, unknown>>;
          readingSessions?: Array<Record<string, unknown>>;
          corrections?: Array<Record<string, unknown>>;
        }>;
        libraryEntries?: Array<Record<string, unknown>>;
        userMangas?: Array<Record<string, unknown>>;
        readingProgress?: Array<Record<string, unknown>>;
        collectionItems?: Array<Record<string, unknown>>;
        bookmarks?: Array<Record<string, unknown>>;
        mangaTags?: Array<Record<string, unknown>>;
        mangaGenres?: Array<Record<string, unknown>>;
      };
    };

    const m = data.manga;
    const chapters = m.chapters || [];

    // Usar transacción para restaurar todo atómicamente
    await prisma.$transaction(async (tx) => {

    // ── 1. Recrear MangaSeries (slug check dentro de la transacción) ──
    let finalSlug = m.slug;
    const existing = await tx.mangaSeries.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      let counter = 1;
      while (await tx.mangaSeries.findUnique({ where: { slug: `${m.slug}-restored-${counter}` } })) {
        counter++;
      }
      finalSlug = `${m.slug}-restored-${counter}`;
    }

    await tx.mangaSeries.create({
      data: {
        id: m.id,
        title: m.title,
        slug: finalSlug,
        description: m.description,
        coverUrl: m.coverUrl,
        authorId: m.authorId,
        authorName: m.authorName,
        status: m.status,
        tags: m.tags,
        totalViews: m.totalViews,
        rating: m.rating,
        deletedAt: null,
        restoredAt: new Date(),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      },
    });

    // ── 2. Recrear Capítulos y sus relaciones ─────────────────────────
    for (const ch of chapters) {
      await tx.chapter.create({
        data: {
          id: ch.id,
          mangaId: ch.mangaId,
          chapterNumber: ch.chapterNumber,
          title: ch.title,
          totalPages: ch.totalPages,
          pageUrls: ch.pageUrls,
          crowdfundingGoal: ch.crowdfundingGoal,
          crowdfundingCurrent: ch.crowdfundingCurrent,
          isCrowdfunded: ch.isCrowdfunded,
          viewCount: ch.viewCount,
          status: ch.status,
          scheduledAt: ch.scheduledAt,
          createdAt: ch.createdAt,
          updatedAt: ch.updatedAt,
        },
      });

      // Recrear Tips
      if (ch.tips?.length) {
        await tx.tip.createMany({
          data: ch.tips.map((t: Record<string, unknown>) => ({
            id: t.id as string,
            chapterId: t.chapterId as string,
            fromUserId: t.fromUserId as string,
            toUserId: t.toUserId as string,
            amount: t.amount as number,
            message: t.message as string | null,
            createdAt: t.createdAt as Date,
          })),
          skipDuplicates: true,
        });
      }

      // Recrear CrowdfundingContributions
      if (ch.crowdfundingContributions?.length) {
        await tx.crowdfundingContribution.createMany({
          data: ch.crowdfundingContributions.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            chapterId: c.chapterId as string,
            userId: c.userId as string,
            amount: c.amount as number,
            isAnonymous: c.isAnonymous as boolean,
            message: c.message as string | null,
            createdAt: c.createdAt as Date,
          })),
          skipDuplicates: true,
        });
      }

      // Recrear SponsorshipBids
      if (ch.sponsorshipBids?.length) {
        await tx.sponsorshipBid.createMany({
          data: ch.sponsorshipBids.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            chapterId: s.chapterId as string,
            userId: s.userId as string,
            bidAmount: s.bidAmount as number,
            status: s.status as string,
            isWinning: s.isWinning as boolean,
            message: s.message as string | null,
            sponsorName: s.sponsorName as string | null,
            createdAt: s.createdAt as Date,
            expiresAt: s.expiresAt as Date | null,
          })),
          skipDuplicates: true,
        });
      }

      // Recrear ReadingSessions
      if (ch.readingSessions?.length) {
        await tx.readingSession.createMany({
          data: ch.readingSessions.map((rs: Record<string, unknown>) => ({
            id: rs.id as string,
            userId: rs.userId as string,
            chapterId: rs.chapterId as string,
            durationSeconds: rs.durationSeconds as number,
            startedAt: rs.startedAt as Date,
            endedAt: rs.endedAt as Date | null,
          })),
          skipDuplicates: true,
        });
      }

      // Recrear ChapterCorrections
      if (ch.corrections?.length) {
        await tx.chapterCorrection.createMany({
          data: ch.corrections.map((corr: Record<string, unknown>) => ({
            id: corr.id as string,
            chapterId: corr.chapterId as string,
            userId: corr.userId as string,
            correctionText: corr.correctionText as string,
            status: corr.status as string,
            rewardAmount: corr.rewardAmount as number,
            createdAt: corr.createdAt as Date,
            reviewedAt: corr.reviewedAt as Date | null,
          })),
          skipDuplicates: true,
        });
      }

      // Recrear Comments
      if (ch.comments?.length) {
        for (const comment of ch.comments) {
          await tx.comment.create({
            data: {
              id: comment.id,
              chapterId: comment.chapterId,
              userId: comment.userId,
              content: comment.content,
              parentId: comment.parentId,
              likesCount: comment.likesCount,
              isDeleted: comment.isDeleted,
              isHidden: comment.isHidden,
              hiddenReason: comment.hiddenReason,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
            },
          });

          // Recrear CommentLikes
          if (comment.likes?.length) {
            await tx.commentLike.createMany({
              data: comment.likes.map((l: Record<string, unknown>) => ({
                id: l.id as string,
                commentId: l.commentId as string,
                userId: l.userId as string,
                createdAt: l.createdAt as Date,
              })),
              skipDuplicates: true,
            });
          }

          // Recrear CommentMentions
          if (comment.mentions?.length) {
            await tx.commentMention.createMany({
              data: comment.mentions.map((m: Record<string, unknown>) => ({
                id: m.id as string,
                commentId: m.commentId as string,
                mentionedUserId: m.mentionedUserId as string,
                createdAt: m.createdAt as Date,
                isRead: m.isRead as boolean,
              })),
              skipDuplicates: true,
            });
          }
        }
      }
    }

    // ── 3. Recrear relaciones directas de MangaSeries ─────────────────
    if (m.libraryEntries?.length) {
      await tx.userLibrary.createMany({
        data: m.libraryEntries.map((le: Record<string, unknown>) => ({
          id: le.id as string,
          userId: le.userId as string,
          mangaId: le.mangaId as string,
          status: le.status as string,
          currentChapter: le.currentChapter as number,
          rating: le.rating as number | null,
          addedAt: le.addedAt as Date,
          updatedAt: le.updatedAt as Date,
        })),
        skipDuplicates: true,
      });
    }

    if (m.userMangas?.length) {
      await tx.userManga.createMany({
        data: m.userMangas.map((um: Record<string, unknown>) => ({
          id: um.id as string,
          userId: um.userId as string,
          mangaId: um.mangaId as string,
          status: um.status as string,
          progress: um.progress as number,
          rating: um.rating as number | null,
          isFavorite: um.isFavorite as boolean,
          addedAt: um.addedAt as Date,
          updatedAt: um.updatedAt as Date,
        })),
        skipDuplicates: true,
      });
    }

    if (m.readingProgress?.length) {
      await tx.readingProgress.createMany({
        data: m.readingProgress.map((rp: Record<string, unknown>) => ({
          id: rp.id as string,
          userId: rp.userId as string,
          mangaId: rp.mangaId as string,
          chapterId: rp.chapterId as string,
          currentPage: rp.currentPage as number,
          percentage: rp.percentage as number,
          completed: rp.completed as boolean,
          completedAt: rp.completedAt as Date | null,
          createdAt: rp.createdAt as Date,
          updatedAt: rp.updatedAt as Date,
          durationSeconds: rp.durationSeconds as number,
        })),
        skipDuplicates: true,
      });
    }

    if (m.collectionItems?.length) {
      await tx.collectionItem.createMany({
        data: m.collectionItems.map((ci: Record<string, unknown>) => ({
          id: ci.id as string,
          collectionId: ci.collectionId as string,
          mangaId: ci.mangaId as string,
          addedAt: ci.addedAt as Date,
        })),
        skipDuplicates: true,
      });
    }

    if (m.bookmarks?.length) {
      await tx.bookmark.createMany({
        data: m.bookmarks.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          userId: b.userId as string,
          mangaId: b.mangaId as string,
          chapterId: b.chapterId as string | null,
          page: b.page as number,
          note: b.note as string | null,
          isPublic: b.isPublic as boolean,
          createdAt: b.createdAt as Date,
          updatedAt: b.updatedAt as Date,
        })),
        skipDuplicates: true,
      });
    }

    if (m.mangaTags?.length) {
      await tx.mangaTag.createMany({
        data: m.mangaTags.map((mt: Record<string, unknown>) => ({
          id: mt.id as string,
          mangaId: mt.mangaId as string,
          tagId: mt.tagId as string,
          createdAt: mt.createdAt as Date,
        })),
        skipDuplicates: true,
      });
    }

    if (m.mangaGenres?.length) {
      await tx.mangaGenre.createMany({
        data: m.mangaGenres.map((mg: Record<string, unknown>) => ({
          id: mg.id as string,
          mangaId: mg.mangaId as string,
          genreId: mg.genreId as string,
          createdAt: mg.createdAt as Date,
        })),
        skipDuplicates: true,
      });
    }

    // ── 4. Eliminar el bundle ─────────────────────────────────────────
    await tx.deletedMangaBundle.delete({ where: { id } });
    }); // end transaction

    // ── 5. Invalidar caches ───────────────────────────────────────────
    await invalidateCache(`manga:${id}`);
    await invalidateCache('manga:list');
    await invalidateCache('user:mangas:list');

    return NextResponse.json({
      message: `Manga "${m.title}" restaurado exitosamente con todos sus datos`,
      restored: true,
    });
  } catch (error) {
    console.error('Error restaurando manga:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
