'use client';

import { use } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { ChapterList, ChapterListChapter } from '@/components/Creator/ChapterList';
import { useManga } from '@/hooks/useManga';
import { Skeletons } from '@/components/Skeletons';
import { cn, formatNumber } from '@/lib/utils';
import {
  ArrowLeftIcon,
  EditIcon,
  PlusIcon,
  BookOpenIcon,
  EyeIcon,
  UsersIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MangaDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { manga, chapters, isLoading, error, deleteChapter } = useManga({ mangaId: slug });
  const [activeTab, setActiveTab] = useState('chapters');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="h-8 w-48 bg-slate-200 rounded mb-4 animate-pulse" />
            <div className="h-96 bg-slate-200 rounded animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600">{error instanceof Error ? error.message : error || 'Manga no encontrado'}</p>
              <Link href="/creator/dashboard">
                <Button variant="outline" className="mt-4">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    ONGOING: { label: 'Publicando', color: 'bg-green-100 text-green-700' },
    COMPLETED: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
    HIATUS: { label: 'Pausado', color: 'bg-amber-100 text-amber-700' },
    DROPPED: { label: 'Abandonado', color: 'bg-red-100 text-red-700' },
  };
  const status = statusLabels[manga.status];

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/creator/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {manga.title}
                </h1>
                <p className="text-slate-500 mt-1">
                  Gestiona tu manga y capítulos
                </p>
              </div>
            </div>
      <div className="flex gap-3">
        <Link href={`/creator/manga/${manga.id}/edit`}>
          <Button variant="outline">
            <EditIcon className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
        <Link href={`/creator/upload?mangaId=${manga.id}`}>
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
                  <div className="aspect-[3/4] bg-slate-200 rounded-lg overflow-hidden">
                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-500">
                        <span className="text-white text-5xl font-bold">
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
                    <span className="text-sm text-slate-500">
                      Creado el {new Date(manga.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {manga.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {manga.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <BookOpenIcon className="w-4 h-4" />
                        <span className="text-sm">Capítulos</span>
                      </div>
            <p className="text-2xl font-bold text-slate-900">
              {chapters.length}
            </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <EyeIcon className="w-4 h-4" />
                        <span className="text-sm">Vistas</span>
                      </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatNumber(manga.totalViews)}
            </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <UsersIcon className="w-4 h-4" />
                        <span className="text-sm">Lectores</span>
                      </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatNumber(manga.stats?.totalReaders ?? 0)}
            </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <TrendingUpIcon className="w-4 h-4" />
                        <span className="text-sm">Crecimiento</span>
                      </div>
            <p className="text-2xl font-bold text-green-600">
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
            <TabsList className="flex gap-2 border-b border-slate-200 mb-6">
              <TabsTrigger
                value="chapters"
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'chapters'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
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
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <BarChart3Icon className="w-4 h-4 mr-2" />
                Estadísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chapters" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Lista de Capítulos
                </h2>
    <Link href={`/creator/upload?mangaId=${manga.id}`}>
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
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm text-slate-500">Promedio de vistas por capítulo</p>
                          <p className="text-xl font-bold text-slate-900">
                            {formatNumber(manga.stats?.avgViewsPerChapter ?? 0)}
                          </p>
                        </div>
                        <EyeIcon className="w-8 h-8 text-indigo-500" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm text-slate-500">Crecimiento mensual</p>
                          <p className="text-xl font-bold text-green-600">
                            +{manga.stats?.monthlyGrowth ?? 0}%
                          </p>
                        </div>
                        <TrendingUpIcon className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm text-slate-500">Total de lectores</p>
                          <p className="text-xl font-bold text-slate-900">
                            {formatNumber(manga.stats?.totalReaders ?? 0)}
                          </p>
                        </div>
                        <UsersIcon className="w-8 h-8 text-amber-500" />
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
                    <span className="text-sm text-slate-500 w-16">
                      Cap. {chapter.chapterNumber}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (chapter.viewCount / ((manga.stats?.avgViewsPerChapter ?? 1) * 1.5)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-20 text-right">
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
