'use client';

import Link from 'next/link';
import { Sidebar } from '@/components/Creator/Sidebar';
import { StatsCard } from '@/components/Creator/StatsCard';
import { MangaCard } from '@/components/Creator/MangaCard';
import { Button } from '@/components/ui/Button';
import { useCreatorMangas } from '@/hooks/useCreatorMangas';
import { Skeletons } from '@/components/Skeletons';
import {
  BookOpenIcon,
  EyeIcon,
  UsersIcon,
  FileTextIcon,
  PlusIcon,
  BarChart3Icon,
  SparklesIcon,
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const { mangas, dashboardStats, isLoading, error, deleteMangaOptimistic } = useCreatorMangas();

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar className="w-full" />
      </div>

      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Panel de Creador
            </h1>
            <p className="text-[var(--text-tertiary)] mt-1">
              Gestiona tus mangas y sigue tu progreso
            </p>
          </div>
          <Link href="/creator/manga/new">
            <Button size="lg" className="w-full sm:w-auto">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Manga
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {isLoading ? (
            <>
              <Skeletons.MangaCard />
              <Skeletons.MangaCard />
              <Skeletons.MangaCard />
              <Skeletons.MangaCard />
            </>
          ) : (
            <>
              <StatsCard
                title="Total Mangas"
                value={dashboardStats?.totalMangas ?? 0}
                icon={BookOpenIcon}
                variant="indigo"
              />
              <StatsCard
                title="Capítulos Publicados"
                value={dashboardStats?.totalChapters ?? 0}
                icon={FileTextIcon}
                variant="purple"
                trend={8}
                trendLabel="este mes"
              />
              <StatsCard
                title="Vistas Totales"
                value={dashboardStats?.totalViews ?? 0}
                icon={EyeIcon}
                variant="green"
                trend={12.5}
                trendLabel="vs mes anterior"
              />
          <StatsCard
            title="Lectores"
            value={dashboardStats?.totalViews ?? 0}
            icon={UsersIcon}
            variant="amber"
            trend={5.3}
          />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/creator/upload">
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <PlusIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Subir Capítulo</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    Añade un nuevo capítulo a tu manga
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/creator/analytics">
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <BarChart3Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Analíticas</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    Revisa estadísticas detalladas
                  </p>
                </div>
              </div>
            </div>
          </Link>
          <Link href="/prompts">
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-6 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                  <SparklesIcon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Prompts IA</h3>
                  <p className="text-sm text-[var(--text-tertiary)] mt-1">
                    Explora prompts para mejorar tu arte
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Mangas Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Mis Mangas</h2>
            <Link href="/creator/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Ver todos
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <Skeletons.MangaCard />
              <Skeletons.MangaCard />
              <Skeletons.MangaCard />
              <Skeletons.MangaCard />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600">{error instanceof Error ? error.message : String(error)}</p>
              <Button variant="outline" className="mt-4">
                Reintentar
              </Button>
            </div>
          ) : mangas.length === 0 ? (
            <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-12 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpenIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No tienes mangas aún
              </h3>
              <p className="text-[var(--text-tertiary)] mb-6 max-w-md mx-auto">
                Comienza tu viaje como creador publicando tu primer manga
              </p>
              <Link href="/creator/manga/new">
                <Button>
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Crear Primer Manga
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {mangas.map((manga) => (
              <MangaCard
                key={manga.id}
                manga={manga}
                onDelete={deleteMangaOptimistic}
              />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
