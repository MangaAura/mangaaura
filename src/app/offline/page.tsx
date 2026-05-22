'use client';

import {
  WifiOff,
  RefreshCw,
  BookOpen,
  Download,
  AlertCircle,
  Trash2,
  HardDrive,
  Image as ImageIcon,
  FileText,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { offlineStorage } from '@/lib/offline-storage';
import { cn } from '@/lib/utils';

interface SavedManga {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  authorName: string;
  lastChapter: number;
}

interface CacheInfo {
  static: number;
  images: number;
  api: number;
  total: number;
}

interface StorageInfo {
  mangas: number;
  chapters: number;
  actions: number;
}

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [savedMangas, setSavedMangas] = useState<SavedManga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
    };

    checkConnection();
    loadSavedMangas();
    loadCacheInfo();
    loadStorageInfo();

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isOnline) {
      timeout = setTimeout(() => {
        router.push('/');
      }, 1000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOnline, router]);

  const loadSavedMangas = async () => {
    try {
      const mangas = await offlineStorage.getSavedMangas();
      setSavedMangas(mangas);
    } catch {
      // Error loading
    } finally {
      setIsLoading(false);
    }
  };

  const loadCacheInfo = useCallback(() => {
    setTimeout(() => setCacheLoading(false), 3000); // fallback timeout
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        if (event.data?.type === 'CACHE_INFO') {
          setCacheInfo(event.data.data);
          setCacheLoading(false);
        }
      };
      try {
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_INFO' },
          [channel.port2]
        );
      } catch {
        setCacheLoading(false);
      }
    } else {
      setCacheLoading(false);
    }
  }, []);

  const loadStorageInfo = async () => {
    try {
      const info = await offlineStorage.getStorageInfo();
      setStorageInfo(info);
    } catch {
      // silent
    }
  };

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      setCacheInfo(null);
      setCacheCleared(true);
    } catch {
      // silent
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-[var(--surface)] flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500',
              isOnline ? 'bg-[var(--success)]/20' : 'bg-[var(--warning)]/20'
            )}
          >
            {isOnline ? (
              <RefreshCw className="w-12 h-12 text-[var(--success)] animate-spin" role="status" aria-label="Restaurando conexión" />
            ) : (
              <WifiOff className="w-12 h-12 text-[var(--warning)]" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Status Message */}
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
          {isOnline ? '¡Conexión restaurada!' : 'Sin conexión a internet'}
        </h1>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
          {isOnline
            ? 'Tu conexión ha vuelto. Puedes continuar navegando normalmente.'
            : 'Parece que has perdido la conexión. Puedes seguir leyendo los capítulos que hayas guardado para modo offline.'}
        </p>

        {/* Retry Button */}
        <div className="mb-8">
          <Button onClick={handleRetry} className="min-w-[200px]">
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            {isOnline ? 'Continuar' : 'Reintentar'}
          </Button>
        </div>

        {/* Storage & Cache Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          {/* IndexedDB Storage */}
          <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-accent-blue" />
              <h2 className="font-semibold text-[var(--text-primary)] text-sm">Almacenamiento offline</h2>
            </div>
            {storageInfo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Mangas guardados
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">{storageInfo.mangas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Capítulos guardados
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">{storageInfo.chapters}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Acciones pendientes
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">{storageInfo.actions}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">Cargando...</p>
            )}
          </div>

          {/* SW Cache */}
          <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-accent-blue" />
              <h2 className="font-semibold text-[var(--text-primary)] text-sm">Caché del navegador</h2>
            </div>
            {cacheLoading ? (
              <p className="text-sm text-[var(--text-tertiary)]">Cargando info de caché...</p>
            ) : cacheInfo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">App Shell</span>
                  <span className="font-medium text-[var(--text-primary)]">{cacheInfo.static}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Imágenes</span>
                  <span className="font-medium text-[var(--text-primary)]">{cacheInfo.images}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">API</span>
                  <span className="font-medium text-[var(--text-primary)]">{cacheInfo.api}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 mt-1 flex items-center justify-between text-sm font-semibold">
                  <span className="text-[var(--text-primary)]">Total</span>
                  <span className="text-[var(--primary)]">{cacheInfo.total}</span>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {clearingCache ? 'Limpiando...' : cacheCleared ? 'Caché limpiada ✓' : 'Limpiar caché'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">Service Worker no disponible</p>
            )}
          </div>
        </div>

        {/* Saved Mangas Section */}
        {!isOnline && savedMangas.length > 0 && (
          <div className="text-left mb-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-blue" aria-hidden="true" />
              Disponible offline
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {savedMangas.map((manga) => (
                <Link key={manga.id} href={`/manga/${manga.slug}`} className="group">
                  <div className="bg-[var(--surface-sunken)] rounded-xl overflow-hidden border border-[var(--border)] hover:border-accent-blue transition-colors">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {manga.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--surface-sunken)] flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-[var(--text-tertiary)]" aria-hidden="true" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-[var(--success)] text-[var(--text-inverse)] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Download className="w-3 h-3" aria-hidden="true" />
                        Offline
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-[var(--text-primary)] text-sm truncate">{manga.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Cap. {manga.lastChapter}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Saved Content */}
        {!isOnline && savedMangas.length === 0 && !isLoading && (
          <div className="bg-[var(--surface-sunken)]/50 rounded-xl p-8 border border-[var(--border)] mb-8">
            <AlertCircle className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No hay contenido guardado</h3>
            <p className="text-[var(--text-secondary)] text-sm">
              Cuando tengas conexión, guarda tus mangas favoritos para leerlos sin internet.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8" role="status">
            <RefreshCw className="w-8 h-8 text-[var(--text-tertiary)] animate-spin" aria-hidden="true" />
          </div>
        )}

        {/* Tips */}
        <div className="p-4 bg-[var(--surface-sunken)]/50 rounded-xl border border-[var(--border)] text-left">
          <h3 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-blue" aria-hidden="true" />
            Consejos para modo offline
          </h3>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1 list-disc list-inside">
            <li>Guarda capítulos desde el lector para leerlos sin conexión</li>
            <li>Los capítulos guardados expiran después de 7 días</li>
            <li>Tu progreso se sincronizará cuando vuelvas a tener conexión</li>
            <li>Usa WiFi para guardar capítulos y ahorrar datos móviles</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
