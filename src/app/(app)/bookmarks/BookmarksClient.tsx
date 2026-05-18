'use client';

import { Bookmark, Trash2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';


interface BookmarkData {
  id: string;
  mangaId: string;
  chapterId: string | null;
  page: number;
  note: string | null;
  createdAt: Date;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
  chapter: {
    id: string;
    chapterNumber: number;
    title: string | null;
  } | null;
}

interface BookmarksClientProps {
  bookmarks: BookmarkData[];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function BookmarksClient({ bookmarks: initial }: BookmarksClientProps) {
  const [bookmarks, setBookmarks] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert('Error al eliminar el marcador');
    } finally {
      setDeletingId(null);
    }
  };

  if (bookmarks.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="w-8 h-8" />}
        title="Sin marcadores"
        description="Los mangas y capítulos que marques aparecerán aquí para que puedas retomarlos fácilmente."
        action={{ label: 'Explorar mangas', href: '/browse' }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Marcadores</h1>
          <p className="text-[var(--text-secondary)]">
            {bookmarks.length} {bookmarks.length === 1 ? 'marcador guardado' : 'marcadores guardados'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {bookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="group overflow-hidden">
            <div className="relative aspect-[3/4] bg-[var(--surface-sunken)]">
              {bookmark.manga.coverUrl ? (
                <OptimizedImage
                  src={bookmark.manga.coverUrl}
                  alt={bookmark.manga.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-[var(--text-muted)]" />
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(bookmark.id)}
                  disabled={deletingId === bookmark.id}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <Link
                href={`/manga/${bookmark.manga.slug}`}
                className="block font-semibold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors line-clamp-2"
              >
                {bookmark.manga.title}
              </Link>
              {bookmark.chapter && (
                <Link
                  href={`/manga/${bookmark.manga.slug}/chapter/${bookmark.chapter.chapterNumber}`}
                  className="block text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                  Capítulo {bookmark.chapter.chapterNumber}
                  {bookmark.chapter.title && ` - ${bookmark.chapter.title}`}
                </Link>
              )}
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-1">
                <span>Página {bookmark.page || 1}</span>
                <span>{formatDate(bookmark.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
