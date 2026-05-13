import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const VALID_ACTION_TYPES = [
  'LIBRARY_ADD',
  'LIBRARY_REMOVE',
  'READING_PROGRESS',
  'CHAPTER_READ',
  'FOLLOW',
  'UNFOLLOW',
  'LIKE',
  'BOOKMARK',
] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const identifier = session.user.id;
    const { allowed } = await rateLimit(
      getRateLimitKey('sync', identifier),
      60,
      3600
    );
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 });
    }

    const action = await request.json();

    if (!action || !action.type) {
      return NextResponse.json(
        { error: 'Acción inválida: falta el tipo' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    switch (action.type) {
case 'LIBRARY_ADD': {
const { mangaId } = action.data || {};
if (!mangaId) {
return NextResponse.json({ error: 'mangaId requerido' }, { status: 400 });
}
await prisma.userLibrary.upsert({
where: {
userId_mangaId: { userId, mangaId },
},
create: { userId, mangaId, status: 'READING' },
update: { updatedAt: new Date() },
});
break;
}

case 'LIBRARY_REMOVE': {
const { mangaId: removeMangaId } = action.data || {};
if (!removeMangaId) {
return NextResponse.json({ error: 'mangaId requerido' }, { status: 400 });
}
await prisma.userLibrary.deleteMany({
where: { userId, mangaId: removeMangaId },
});
break;
}

case 'READING_PROGRESS': {
const { mangaId, chapterId, currentPage, percentage } = action.data || {};
if (!mangaId || !chapterId) {
return NextResponse.json(
{ error: 'mangaId y chapterId requeridos' },
{ status: 400 }
);
}
await prisma.readingProgress.upsert({
where: {
userId_mangaId_chapterId: { userId, mangaId, chapterId },
},
create: {
userId,
mangaId,
chapterId,
currentPage: currentPage || 0,
percentage: percentage || 0,
},
update: {
currentPage: currentPage || 0,
percentage: percentage || 0,
},
});
break;
}

      case 'CHAPTER_READ': {
        const { mangaId: readMangaId, chapterId } = action.data || {};
        if (!readMangaId || !chapterId) {
          return NextResponse.json(
            { error: 'mangaId y chapterId requeridos' },
            { status: 400 }
          );
        }
await prisma.analyticsEvent.create({
data: {
eventType: 'chapter_read',
userId,
metadata: JSON.stringify({ mangaId: readMangaId, chapterId, timestamp: new Date(action.timestamp || new Date()).toISOString() }),
} as any,
        });
        break;
      }

      case 'FOLLOW': {
        const { followingId, followingType } = action.data || {};
        if (!followingId || !followingType) {
          return NextResponse.json(
            { error: 'followingId y followingType requeridos' },
            { status: 400 }
          );
        }
        await prisma.follow.upsert({
          where: {
            followerId_followingId_followingType: {
              followerId: userId,
              followingId,
              followingType,
            },
          },
          create: {
            followerId: userId,
            followingId,
            followingType,
          },
          update: {},
        });
        break;
      }

      case 'UNFOLLOW': {
        const { followingId: unfollowId, followingType: unfollowType } = action.data || {};
        if (!unfollowId || !unfollowType) {
          return NextResponse.json(
            { error: 'followingId y followingType requeridos' },
            { status: 400 }
          );
        }
        await prisma.follow.deleteMany({
          where: {
            followerId: userId,
            followingId: unfollowId,
            followingType: unfollowType,
          },
        });
        break;
      }

      case 'LIKE': {
        const { targetType, targetId } = action.data || {};
        if (!targetType || !targetId) {
          return NextResponse.json(
            { error: 'targetType y targetId requeridos' },
            { status: 400 }
          );
        }
        if (targetType === 'comment') {
          await prisma.commentLike.upsert({
where: {
commentId_userId: { commentId: targetId, userId },
            },
            create: { userId, commentId: targetId },
            update: {},
          });
        }
        break;
      }

  case 'BOOKMARK': {
      const { chapterId: bookmarkChapterId, pageNumber: bookmarkPage } = action.data || {};
      if (!bookmarkChapterId) {
        return NextResponse.json(
          { error: 'chapterId requerido' },
          { status: 400 }
        );
      }
      const chapter = await prisma.chapter.findUnique({
        where: { id: bookmarkChapterId },
        select: { mangaId: true },
      });
      if (!chapter) {
        return NextResponse.json(
          { error: 'Capítulo no encontrado' },
          { status: 404 }
        );
      }
      await prisma.readingProgress.upsert({
        where: {
          userId_mangaId_chapterId: { userId, mangaId: chapter.mangaId, chapterId: bookmarkChapterId },
        },
        create: {
          userId,
          mangaId: chapter.mangaId,
          chapterId: bookmarkChapterId,
          currentPage: bookmarkPage || 0,
        },
        update: {
          currentPage: bookmarkPage || 0,
        },
      });
      break;
    }

      default:
        return NextResponse.json(
          { error: `Tipo de acción desconocido: ${action.type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en sync:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
