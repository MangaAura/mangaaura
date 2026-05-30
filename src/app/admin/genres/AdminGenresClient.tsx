'use client';

import {
  Bookmark,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { extractApiError } from '@/lib/extract-api-error';

interface Genre {
  id: string;
  name: string;
  slug: string;
  mangaCount?: number;
  createdAt: string;
}

export default function AdminGenresClient() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingGenre, setDeletingGenre] = useState<Genre | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadGenres = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/genres');
      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }
      const data = await response.json();

      // Fetch manga counts for all genres in a single request
      const countsMap: Record<string, number> = {};
      try {
        const countRes = await fetch('/api/genres/counts');
        if (countRes.ok) {
          const countData = await countRes.json();
          if (countData?.counts) {
            for (const c of countData.counts) {
              countsMap[c.slug] = c._count;
            }
          }
        }
      } catch {
        // silently fail, counts will be 0
      }

      setGenres(
        (data.genres || []).map((g: Genre) => ({
          ...g,
          mangaCount: countsMap[g.slug] || 0,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar géneros');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  const filteredGenres = genres.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.slug.toLowerCase().includes(q)
    );
  });

  const confirmDelete = async () => {
    if (!deletingGenre) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/genres/${deletingGenre.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { message } = await extractApiError(response);
        throw new Error(message);
      }

      setGenres((prev) => prev.filter((g) => g.id !== deletingGenre.id));
      setDeletingGenre(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar género');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-[var(--primary)]" />
            Gestión de Géneros
          </h1>
          <p className="text-[var(--text-muted)]">
            Administra los géneros del sistema
          </p>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[var(--primary)]" />
            Todos los géneros
            <span className="text-sm font-normal text-[var(--text-tertiary)]">
              ({filteredGenres.length} de {genres.length})
            </span>
          </CardTitle>
          <div className="relative flex-1 sm:w-64">
            <Input
              placeholder="Buscar géneros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="animate-pulse space-y-3 p-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-[var(--surface-sunken)] rounded" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorMessage message={error} action={{ label: 'Reintentar', onClick: () => { setIsLoading(true); loadGenres(); } }} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                      Género
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden sm:table-cell">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">
                      Mangas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredGenres.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-[var(--text-tertiary)]">
                        <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No se encontraron géneros</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGenres.map((genre) => (
                      <tr
                        key={genre.id}
                        className="hover:bg-[var(--surface-sunken)]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: 'var(--primary)' }}
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--text-primary)] text-sm">
                                {genre.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <Badge variant="outline" className="text-xs font-mono">
                            {genre.slug}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className="text-sm text-[var(--text-secondary)]">
                            {genre.mangaCount ?? '...'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingGenre(genre)}
                            title="Eliminar género"
                            aria-label={`Eliminar ${genre.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-[var(--error)]" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deletingGenre} onOpenChange={(open) => { if (!open) setDeletingGenre(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--error)]">
              <Trash2 className="w-5 h-5" />
              Eliminar género
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el género &quot;{deletingGenre?.name}&quot;?
              {deletingGenre && deletingGenre.mangaCount && deletingGenre.mangaCount > 0 && (
                <span className="block mt-2 text-[var(--warning)]">
                  ⚠️ Este género tiene {deletingGenre.mangaCount} manga(s) asociados.
                  La relación se eliminará automáticamente pero los mangas no se verán afectados.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {deletingGenre && (
            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg my-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: 'var(--primary)' }}
                />
                <span className="font-medium text-sm">{deletingGenre.name}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {deletingGenre.slug}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGenre(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} isLoading={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
