import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/creator/onboarding-status - Progreso del creador
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        bio: true,
        avatarUrl: true,
        _count: {
          select: {
            createdMangas: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Step 1: Perfil completo (tiene bio O avatar)
    const profileComplete = !!(user.bio || user.avatarUrl);

    // Step 2: Tiene al menos 1 manga creado
    const hasManga = user._count.createdMangas > 0;

    // Step 3: Tiene al menos 1 capítulo publicado
    let hasChapter = false;
    if (hasManga) {
      const chapterCount = await prisma.chapter.count({
        where: {
          manga: { authorId: userId },
          status: 'PUBLISHED',
        },
      });
      hasChapter = chapterCount > 0;
    }

    // Step 4: Tiene tags/géneros en al menos un manga
    let hasTags = false;
    if (hasManga) {
      const mangaWithTags = await prisma.mangaSeries.findFirst({
        where: {
          authorId: userId,
          OR: [
            { mangaGenres: { some: {} } },
            { tags: { not: '[]' } },
          ],
        },
        select: { id: true },
      });
      hasTags = !!mangaWithTags;
    }

    // Step 5: Ha creado al menos un anuncio (todos los mangas creados están "publicados" por defecto)
    let hasShared = false;
    if (hasManga) {
      const announcementCount = await prisma.mangaAnnouncement.count({
        where: { authorId: userId, isPublished: true },
      });
      hasShared = announcementCount > 0;
    }

    const steps = [
      {
        id: 'profile',
        title: 'Completa tu perfil',
        description: 'Añade una biografía y foto de perfil para que los lectores te conozcan',
        completed: profileComplete,
        link: '/settings/profile',
        icon: '👤',
      },
      {
        id: 'create_manga',
        title: 'Crea tu primer manga',
        description: 'Define el título, portada y sinopsis de tu obra',
        completed: hasManga,
        link: '/creator/manga/new',
        icon: '📖',
      },
      {
        id: 'upload_chapter',
        title: 'Sube tu primer capítulo',
        description: 'Publica tu primer capítulo con páginas para que los lectores lo disfruten',
        completed: hasChapter,
        link: '/creator/upload',
        icon: '📄',
      },
      {
        id: 'add_tags',
        title: 'Personaliza con géneros',
        description: 'Añade etiquetas y géneros para que otros descubran tu manga',
        completed: hasTags,
        link: '/creator/manga',
        icon: '🏷️',
      },
      {
        id: 'share',
        title: 'Comparte con la comunidad',
        description: 'Haz un anuncio o comparte tu obra para atraer tus primeros lectores',
        completed: hasShared,
        link: '/creator/dashboard',
        icon: '📢',
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const isComplete = completedCount === steps.length;

    return NextResponse.json({
      steps,
      completedCount,
      totalSteps: steps.length,
      isComplete,
    });
  } catch (error) {
    console.error('[CreatorOnboarding] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
