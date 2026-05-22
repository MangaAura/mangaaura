import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Lock,
  Globe,
  BookOpen,
  ArrowLeft,
  Clock,
  Share2,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MangaCard } from '@/components/MangaCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';



interface CollectionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getCollectionData(id: string) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      items: {
        orderBy: { addedAt: 'desc' },
        take: 30,
      },
      collaborators: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  if (!collection) return null;

  const mangaIds = collection.items.map((item) => item.mangaId);
  const mangas = mangaIds.length > 0
    ? await prisma.mangaSeries.findMany({
        where: { id: { in: mangaIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          coverUrl: true,
          status: true,
          tags: true,
          authorName: true,
          author: { select: { username: true } },
          rating: true,
          totalViews: true,
        },
      })
    : [];

  const mangaMap = new Map(mangas.map((m) => [m.id, m]));

  return {
    ...collection,
    mangaItems: collection.items.map((item) => ({
      addedAt: item.addedAt,
      manga: mangaMap.get(item.mangaId) || null,
    })).filter((item) => item.manga !== null),
  };
}

export async function generateMetadata({ params }: CollectionDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const collection = await prisma.collection.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  return {
    title: collection ? `${collection.title} | Colecciones | MangaAura` : 'Colección | MangaAura',
    description: collection?.description || 'Colección de manga',
  };
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const collection = await getCollectionData(id);

  if (!collection) notFound();

  if (!collection.isPublic && collection.userId !== session?.user?.id) {
    notFound();
  }

  const isOwner = session?.user?.id === collection.userId;
  const isCollaborator = !isOwner && session?.user?.id
    ? collection.collaborators.some((c) => c.userId === session.user.id)
    : false;
  const canEdit = isOwner || isCollaborator;

  const mangas = collection.mangaItems.map((item) => ({
    id: item.manga!.id,
    title: item.manga!.title,
    slug: item.manga!.slug,
    coverUrl: item.manga!.coverUrl,
    status: item.manga!.status,
    tags: JSON.parse(item.manga!.tags || '[]'),
    authorName: item.manga!.authorName,
    authorUsername: item.manga!.author?.username,
    rating: item.manga!.rating || null,
    totalViews: item.manga!.totalViews,
    chapterCount: undefined,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a colecciones
        </Link>

        <Card className="p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {collection.title}
                </h1>
                <Badge variant={collection.isPublic ? 'default' : 'secondary'}>
                  {collection.isPublic ? (
                    <Globe className="w-3 h-3 mr-1" />
                  ) : (
                    <Lock className="w-3 h-3 mr-1" />
                  )}
                  {collection.isPublic ? 'Pública' : 'Privada'}
                </Badge>
              </div>

              {collection.description && (
                <p className="text-[var(--text-secondary)] mb-4">{collection.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
                <Link
                  href={`/user/${collection.user.username}`}
                  className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={collection.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {collection.user.displayName?.[0] || collection.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  {collection.user.displayName || collection.user.username}
                </Link>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {collection._count.items} mangas
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(collection.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {canEdit && (
                <Link href={`/collections/${collection.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </Link>
              )}
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/collections/${collection.id}`;
                  if (navigator.share) {
                    await navigator.share({ title: collection.title, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            </div>
          </div>
        </Card>

        {collection.collaborators.length > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[var(--text-secondary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Colaboradores
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {collection.collaborators.map((collaborator) => (
                <Link
                  key={collaborator.id}
                  href={`/user/${collaborator.user.username}`}
                  className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={collaborator.user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-[var(--surface-sunken)]">
                      {collaborator.user.displayName?.[0] || collaborator.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{collaborator.user.displayName || collaborator.user.username}</span>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {mangas.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mangas.map((manga) => (
              <MangaCard key={manga.id} manga={manga} size="sm" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin mangas"
            description="Esta colección aún no tiene mangas"
            icon={<BookOpen className="w-12 h-12 text-[var(--text-tertiary)]" />}
          />
        )}
      </div>
    </div>
  );
}