'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import {
  ArrowLeftIcon,
  EditIcon,
  PlusIcon,
  BookOpenIcon,
  EyeIcon,
  UsersIcon,
  TrendingUpIcon,
  BarChart3Icon,
 Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { use , useState } from 'react';

import { ChapterList, ChapterListChapter } from '@/components/Creator/ChapterList';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useManga } from '@/hooks/useManga';
import { useT } from '@/i18n';
import { cn, formatNumber } from '@/lib/utils';


interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MangaDetailClient({ params }: PageProps) {
  const { slug } = use(params);
  const { manga, chapters, isLoading, error, deleteChapter } = useManga({ mangaId: slug });
  const [activeTab, setActiveTab] = useState('chapters');

  // Always call hooks before any early returns
  const t = useT();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 w-48 bg-[var(--surface-sunken)] rounded mb-4 animate-pulse" />
            <div className="h-96 bg-[var(--surface-sunken)] rounded animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl p-8 text-center">
              <p className="text-[var(--error)] text-lg font-medium">
                {error instanceof Error ? error.message : error || t('creatorMangaEdit.notFound')}
              </p>
              <p className="text-[var(--text-tertiary)] mt-2 text-sm">
                {t('creatorMangaEdit.notFoundSuggestion')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <Link href="/creator/trash">
                  <Button variant="outline">
                    <Trash2Icon className="w-4 h-4 mr-2" />
                    {t('creatorMangaEdit.checkTrash')}
                  </Button>
                </Link>
                <Link href="/creator/dashboard">
                  <Button variant="ghost">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    {t('creatorMangaEdit.backToDashboard')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  const STATUS_KEYS: Record<string, string> = {
    ONGOING: 'manga.ongoing',
    COMPLETED: 'manga.completed',
    HIATUS: 'manga.hiatus',
    DROPPED: 'manga.dropped',
  };
  const STATUS_COLORS: Record<string, string> = {
    ONGOING: 'bg-[var(--success)]/80 text-[var(--text-inverse)] border-[var(--success)]/30',
    COMPLETED: 'bg-[var(--info)]/80 text-[var(--text-inverse)] border-[var(--info)]/30',
    HIATUS: 'bg-[var(--warning)]/80 text-[var(--text-inverse)] border-[var(--warning)]/30',
    DROPPED: 'bg-[var(--error)]/80 text-[var(--text-inverse)] border-[var(--error)]/30',
  };
  const status = {
    label: t(STATUS_KEYS[manga.status] || ''),
    color: STATUS_COLORS[manga.status] || 'bg-[var(--text-muted)]',
  };

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/creator/dashboard">
<Button variant="ghost" size="icon" aria-label="Volver">
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {manga.title}
                </h1>
                <p className="text-[var(--text-tertiary)] mt-1">
                  Gestiona tu manga y capítulos
                </p>
              </div>
            </div>
      <div className="flex gap-3">
        <Link href={`/manga/${manga.slug}`} target="_blank">
          <Button variant="ghost">
            <EyeIcon className="w-4 h-4 mr-2" />
            Ver Página
          </Button>
        </Link>
        <Link href={`/creator/manga/${manga.slug}/edit`}>
          <Button variant="outline">
            <EditIcon className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
        <Link href={`/creator/upload?mangaId=${manga.slug}`}>
          <Button>
            <PlusIcon className="w-4 h-4 mr-2" />
            Subir Capítulo
          </Button>
        </Link>
      </div>
          </div>

          {/* Manga Info Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Cover */}
                <div className="w-full md:w-48 flex-shrink-0">
                  <div className="aspect-[3/4] bg-[var(--surface-sunken)] rounded-lg overflow-hidden">
                    {manga.coverUrl ? (
                      <OptimizedImage
                        src={manga.coverUrl}
                        alt={manga.title}
                        fill
                        className="w-full h-full object-cover"
                      />
                    ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
          <span className="text-[var(--text-inverse)] text-5xl font-bold">
                          {manga.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={cn('px-3 py-1 text-sm font-medium rounded-full', status.color)}>
                      {status.label}
                    </span>
                    <span className="text-sm text-[var(--text-tertiary)]">
                      Creado el {new Date(manga.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  <p className="text-[var(--text-tertiary)] mb-4 line-clamp-3">
                    {manga.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {manga.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[var(--surface-sunken)] text-[var(--text-tertiary)] rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[var(--surface)] rounded-lg p-4">
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                        <BookOpenIcon className="w-4 h-4" />
                        <span className="text-sm">Capítulos</span>
                      </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {chapters.length}
            </p>
                    </div>
                    <div className="bg-[var(--surface)] rounded-lg p-4">
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-sm">Vistas</span>
                      </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {formatNumber(manga.totalViews)}
            </p>
                    </div>
                    <div className="bg-[var(--surface)] rounded-lg p-4">
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                        <UsersIcon className="w-4 h-4" />
                        <span className="text-sm">Lectores</span>
                      </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {formatNumber(manga.stats?.totalReaders ?? 0)}
            </p>
                    </div>
                    <div className="bg-[var(--surface)] rounded-lg p-4">
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-1">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span className="text-sm">Crecimiento</span>
                      </div>
            <p className="text-2xl font-bold text-[var(--success)]">
              +{manga.stats?.monthlyGrowth ?? 0}%
            </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex gap-2 border-b border-[var(--border)] mb-6">
              <TabsTrigger
                value="chapters"
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'chapters'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                )}
              >
            <BookOpenIcon className="w-4 h-4 mr-2" />
            Capítulos ({chapters.length})
          </TabsTrigger>
              <TabsTrigger
                value="stats"
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'stats'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                )}
              >
                <BarChart3Icon className="w-4 h-4 mr-2" />
                Estadísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chapters" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Lista de Capítulos
                </h2>
    <Link href={`/creator/upload?mangaId=${manga.slug}`}>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              Subir Nuevo Capítulo
            </Button>
          </Link>
              </div>
        <ChapterList
          chapters={chapters.map((c): ChapterListChapter => ({
            id: c.id,
            number: c.chapterNumber,
            title: c.title || `Capítulo ${c.chapterNumber}`,
            views: c.viewCount,
            publishedAt: c.createdAt,
            status: 'PUBLISHED',
          }))}
          mangaId={manga.id}
          mangaSlug={manga.slug}
          onDelete={deleteChapter}
        />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estadísticas Generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg">
                        <div>
                          <p className="text-sm text-[var(--text-tertiary)]">Promedio de vistas por capítulo</p>
                          <p className="text-xl font-bold text-[var(--text-primary)]">
                            {formatNumber(manga.stats?.avgViewsPerChapter ?? 0)}
                          </p>
                        </div>
                        <EyeIcon className="w-8 h-8 text-[var(--primary)]" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg">
                        <div>
                          <p className="text-sm text-[var(--text-tertiary)]">Crecimiento mensual</p>
                          <p className="text-xl font-bold text-[var(--success)]">
                            +{manga.stats?.monthlyGrowth ?? 0}%
                          </p>
                        </div>
                        <TrendingUpIcon className="w-8 h-8 text-[var(--success)]" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg">
                        <div>
                          <p className="text-sm text-[var(--text-tertiary)]">Total de lectores</p>
                          <p className="text-xl font-bold text-[var(--text-primary)]">
                            {formatNumber(manga.stats?.totalReaders ?? 0)}
                          </p>
                        </div>
                        <UsersIcon className="w-8 h-8 text-[var(--warning)]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Capítulo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                {(chapters ?? []).slice(0, 5).map((chapter) => (
                  <div key={chapter.id} className="flex items-center gap-4">
                    <span className="text-sm text-[var(--text-tertiary)] w-16">
                      Cap. {chapter.chapterNumber}
                    </span>
                    <div className="flex-1 bg-[var(--surface-sunken)] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[var(--primary)] h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (chapter.viewCount / ((manga.stats?.avgViewsPerChapter ?? 1) * 1.5)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-secondary)] w-20 text-right">
                      {formatNumber(chapter.viewCount)}
                    </span>
                  </div>
                ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
