'use client';

import { motion } from 'framer-motion';
import {
  Trash2Icon,
  RotateCcwIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  EyeIcon,
  ClockIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Papelera | MangaAura',
  description: 'Recupera mangas y capítulos eliminados en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Papelera | MangaAura',
    description: 'Recupera mangas y capítulos eliminados en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Papelera | MangaAura',
    description: 'Recupera elementos eliminados en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/trash' },
};

interface TrashManga {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: string;
  tags: string[];
  totalViews: number;
  deletedAt: string;
  daysLeft: number;
  createdAt: string;
  source: 'bundle' | 'soft';
}

export default function TrashPage() {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrashManga | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ mangas: TrashManga[]; pagination: { total: number } }>(
    '/api/trash/mangas',
    (url: string) => fetch(url).then((r) => r.json())
  );

  const mangas = data?.mangas || [];

  const handleRestore = useCallback(async (id: string) => {
    setRestoringId(id);
    try {
      const res = await fetch(`/api/trash/mangas/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Error al restaurar');
      await mutate();
      router.refresh();
    } catch {
      alert('Error al restaurar el manga');
    } finally {
      setRestoringId(null);
    }
  }, [mutate, router]);

  const handlePermanentDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trash/mangas/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      await mutate();
      setDeleteTarget(null);
    } catch {
      alert('Error al eliminar el manga permanentemente');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, mutate]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-red-500/10">
            <Trash2Icon className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Papelera
            </h1>
            <p className="text-[var(--text-tertiary)] mt-1">
              Los mangas en la papelera se eliminarán permanentemente después de 30 días
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[var(--surface-elevated)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-red-500 font-medium">Error al cargar la papelera</p>
          </div>
        ) : mangas.length === 0 ? (
          <div className="bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border)] p-12 text-center">
            <div className="w-16 h-16 bg-[var(--surface-sunken)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2Icon className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              La papelera está vacía
            </h3>
            <p className="text-[var(--text-tertiary)]">
              Los mangas que elimines aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mangas.map((manga, i) => (
              <motion.div
                key={manga.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] overflow-hidden hover:border-red-500/30 transition-colors"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Cover */}
                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-[var(--surface-sunken)] flex-shrink-0">
                    {manga.coverUrl ? (
                      <Image src={manga.coverUrl} alt={manga.title} width={48} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-orange-500/20">
                        <BookOpenIcon className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">
                        {manga.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium flex-shrink-0">
                        {manga.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-3.5 h-3.5" />
                        {manga.totalViews.toLocaleString()} vistas
                      </span>
                      <span className={cn(
                        'flex items-center gap-1',
                        manga.daysLeft <= 3 ? 'text-red-500 font-medium' : ''
                      )}>
                        <ClockIcon className="w-3.5 h-3.5" />
                        {manga.daysLeft} días restantes
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(manga.id)}
                      disabled={restoringId === manga.id}
                    >
                      <RotateCcwIcon className={cn('w-4 h-4 mr-1.5', restoringId === manga.id && 'animate-spin')} />
                      Restaurar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(manga)}
                    >
                      <Trash2Icon className="w-4 h-4 mr-1.5" />
                      Eliminar
                    </Button>
                    <Link href={`/manga/${manga.slug}`} target="_blank">
                      <Button variant="ghost" size="icon" aria-label="Ver página pública">
                        <ExternalLinkIcon className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Permanent Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangleIcon className="w-5 h-5" />
              Eliminar permanentemente
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El manga y todos sus capítulos se eliminarán permanentemente.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="bg-[var(--surface)] p-4 rounded-lg my-2">
              <p className="font-medium text-[var(--text-primary)]">{deleteTarget.title}</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                {deleteTarget.tags.length} etiquetas · {deleteTarget.totalViews.toLocaleString()} vistas
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handlePermanentDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
