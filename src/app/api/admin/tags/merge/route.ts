import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rlResponse = await withRateLimit(request, session.user.id, 'default');
    if (rlResponse) return rlResponse;

    const { sourceId, targetId } = await request.json();
    if (!sourceId || !targetId) {
      return NextResponse.json({ error: 'sourceId and targetId are required' }, { status: 400 });
    }

    if (sourceId === targetId) {
      return NextResponse.json({ error: 'Cannot merge a tag with itself' }, { status: 400 });
    }

    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findUnique({ where: { id: sourceId } }),
      prisma.tag.findUnique({ where: { id: targetId } }),
    ]);

    if (!sourceTag) {
      return NextResponse.json({ error: 'Source tag not found' }, { status: 404 });
    }
    if (!targetTag) {
      return NextResponse.json({ error: 'Target tag not found' }, { status: 404 });
    }

    // Get manga tags to migrate (outside transaction, read-only)
    const mangaTagsToUpdate = await prisma.mangaTag.findMany({
      where: { tagId: sourceId },
    });

    // Execute all mutations in a transaction
    const mangaMigrated = await prisma.$transaction(async (tx) => {
      let migrated = 0;

      for (const mt of mangaTagsToUpdate) {
        const existing = await tx.mangaTag.findUnique({
          where: { mangaId_tagId: { mangaId: mt.mangaId, tagId: targetId } },
        });

        if (!existing) {
          await tx.mangaTag.update({
            where: { id: mt.id },
            data: { tagId: targetId },
          });
        } else {
          await tx.mangaTag.delete({ where: { id: mt.id } });
        }
        migrated++;
      }

      // Reassign children tags to the target
      await tx.tag.updateMany({
        where: { parentId: sourceId },
        data: { parentId: targetId },
      });

      // Delete the source tag
      await tx.tag.delete({ where: { id: sourceId } });

      return migrated;
    });

    await prisma.securityAuditLog.create({
      data: {
        userId: session.user.id,
        action: 'MERGE_TAGS',
        targetId: targetId,
        targetType: 'TAG',
        metadata: JSON.stringify({
          sourceId,
          sourceName: sourceTag.name,
          targetName: targetTag.name,
          mangaMigrated,
        }),
        severity: 'NORMAL',
      },
    });

    return NextResponse.json({
      message: 'Tags merged successfully',
      target: targetTag,
      mangaMigrated,
    });
  } catch (error) {
    console.error('Error merging tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
