'use client';

import { motion } from 'framer-motion';
import {
  ImageIcon,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Coins,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Container } from '@/components/Layout/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface HistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  provider: string;
  imageUrl: string | null;
  auraCost: number;
  status: string;
  createdAt: string;
  width: number;
  height: number;
  quality: string;
  style: string | null;
  errorMessage?: string;
}

export default function GenerateHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ai/generate-image?limit=40');
        if (!res.ok) throw new Error('Error al cargar historial');
        const data = await res.json();
        setItems(data.items);
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Load more
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(`/api/ai/generate-image?limit=40&cursor=${cursor}`);
      if (!res.ok) throw new Error('Error al cargar más');
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  // Infinite scroll
  useEffect(() => {
    if (!loadRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator/ai/generate">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <h1 className="text-2xl font-bold">Historial de generaciones</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Todas tus imágenes generadas con IA
            </p>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </Card>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20 text-[var(--text-tertiary)]" />
            <h3 className="text-lg font-semibold mb-2">Sin generaciones</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Aún no has generado ninguna imagen.
            </p>
            <Link href="/creator/ai/generate">
              <Button variant="default">
                <Sparkles className="w-4 h-4 mr-2" />
                Generar primera imagen
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-sunken)]"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.status === 'FAILED' ? (
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    ) : (
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
                    )}
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs line-clamp-2 mb-2">
                    {item.prompt}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-white/80">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.createdAt)}
                    <span className="ml-auto flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      {item.auraCost}
                    </span>
                  </div>
                </div>

                {/* Status badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {item.status === 'COMPLETED' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/80 text-white backdrop-blur-sm">
                      {item.width}x{item.height}
                    </span>
                  )}
                  {item.status === 'FAILED' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/80 text-white backdrop-blur-sm">
                      Falló
                    </span>
                  )}
                  {item.status === 'PROCESSING' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/80 text-white backdrop-blur-sm">
                      Procesando
                    </span>
                  )}
                </div>

                {/* Open button */}
                {item.imageUrl && (
                  <a
                    href={item.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && (
          <div ref={loadRef} className="flex items-center justify-center py-8">
            {loadingMore ? (
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">
                Desplázate para cargar más
              </p>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
