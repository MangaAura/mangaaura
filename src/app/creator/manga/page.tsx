'use client';

import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { MangaCard } from '@/components/Creator/MangaCard';
import { Skeletons } from '@/components/Skeletons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useCreatorMangas } from '@/hooks/useCreatorMangas';
import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mis Mangas | MangaAura',
  description: 'Gestiona tus series de manga publicadas en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Mis Mangas | MangaAura',
    description: 'Gestiona tus series de manga publicadas en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mis Mangas | MangaAura',
    description: 'Gestiona tus mangas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/manga' },
};

export default function MyMangaPage() {
  const {
    mangas,
    isLoading,
    error,
    currentPage,
    totalPages,
    filters,
    setFilters,
    goToPage,
    nextPage,
    previousPage,
    deleteManga,
  } = useCreatorMangas({ autoRefresh: false });
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchInput || undefined });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <BookOpenIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Mis Mangas
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
                Administra tus series de manga
              </p>
            </div>
          </div>
          <Link href="/creator/manga/new">
            <Button size="lg">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Manga
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar manga..."
                className="pl-9"
              />
            </div>
          </form>
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => setFilters({ status: v === 'all' ? undefined : v as any })}
          >
            <SelectTrigger className="w-full sm:w-40">
              <FilterIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ONGOING">En emisión</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
              <SelectItem value="HIATUS">En pausa</SelectItem>
              <SelectItem value="DROPPED">Abandonado</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={`${filters.sortBy || 'updatedAt'}-${filters.sortOrder || 'desc'}`}
            onValueChange={(v) => {
              const [sortBy, sortOrder] = v.split('-') as [any, any];
              setFilters({ sortBy, sortOrder });
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <ArrowUpDownIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt-desc">Actualizado (reciente)</SelectItem>
              <SelectItem value="updatedAt-asc">Actualizado (antiguo)</SelectItem>
              <SelectItem value="createdAt-desc">Creado (reciente)</SelectItem>
              <SelectItem value="totalViews-desc">Más visto</SelectItem>
              <SelectItem value="rating-desc">Mejor valorado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeletons.MangaCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-red-500 font-medium">Error al cargar mangas</p>
          </div>
        ) : mangas.length === 0 ? (
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpenIcon className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
              {filters.search ? 'Sin resultados' : 'No tienes mangas aún'}
            </h3>
            <p className="text-[var(--text-tertiary)] mb-8 max-w-md mx-auto">
              {filters.search
                ? 'Intenta con otro término de búsqueda'
                : 'Crea tu primer manga y comienza a compartir tu historia'}
            </p>
            {!filters.search && (
              <Link href="/creator/manga/new">
                <Button size="lg">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Crear primer manga
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {mangas.map((manga, i) => (
                <motion.div
                  key={manga.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <MangaCard manga={manga} onDelete={deleteManga} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={currentPage <= 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-[var(--text-tertiary)]">...</span>
                      )}
                      <Button
                        variant={p === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(p)}
                        className={cn(p === currentPage ? '' : '')}
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
