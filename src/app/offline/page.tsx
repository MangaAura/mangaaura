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
import { useT } from '@/i18n';
import { offlineStorage } from '@/lib/offline-storage';
import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lectura Offline | MangaAura',
  description: 'Gestiona tu contenido descargado para leer sin conexión en MangaAura.',
  openGraph: {
    title: 'Lectura Offline | MangaAura',
    description: 'Gestiona tu contenido descargado para leer sin conexión en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lectura Offline | MangaAura',
    description: 'Contenido offline en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/offline' },
};

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function OfflinePage() {
  const t = useT();
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
    /* eslint-disable react-hooks/immutability */
    loadSavedMangas();
    loadCacheInfo();
    loadStorageInfo();
    /* eslint-enable react-hooks/immutability */

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
    setTimeout(() => setCacheLoading(false), 3000);
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

  const s = (token: string) => `var(${token})`;

  return (
    <main
      id="main-content"
      className="min-h-screen"
      style={{ background: s('--md-sys-color-surface-dim') }}
    >
      <div
        className="mx-auto w-full px-4 py-16 md:py-24"
        style={{
          maxWidth: '840px',
          paddingLeft: 'clamp(16px, 5vw, 24px)',
          paddingRight: 'clamp(16px, 5vw, 24px)',
        }}
      >
        {/* Status Section */}
        <section className="flex flex-col items-center text-center mb-16 md:mb-24">
          <div
            className={cn(
              'w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-8',
              'transition-all duration-500',
              isOnline
                ? '' : ''
            )}
            style={{
              background: isOnline
                ? s('--md-sys-color-primary-container')
                : s('--md-sys-color-surface-container-high'),
              transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            {isOnline ? (
              <RefreshCw
                className="w-14 h-14 md:w-16 md:h-16 animate-spin"
                style={{ color: s('--md-sys-color-on-primary-container') }}
                role="status"
                aria-label={t('offline.reconnecting')}
              />
            ) : (
              <WifiOff
                className="w-14 h-14 md:w-16 md:h-16"
                style={{ color: s('--md-sys-color-on-surface-variant') }}
                aria-hidden="true"
              />
            )}
          </div>

          <h1
            className="mb-4"
            style={{
              fontSize: s('--md-sys-typescale-headline-medium-size'),
              fontWeight: s('--md-sys-typescale-headline-medium-weight'),
              lineHeight: 1.2,
              color: s('--md-sys-color-on-surface'),
            }}
          >
            {isOnline ? t('offline.reconnecting') : t('offline.noConnection')}
          </h1>

          <p
            className="max-w-lg mx-auto mb-10"
            style={{
              fontSize: s('--md-sys-typescale-body-large-size'),
              fontWeight: s('--md-sys-typescale-body-large-weight'),
              lineHeight: s('--md-sys-typescale-body-large-line-height'),
              color: s('--md-sys-color-on-surface-variant'),
            }}
          >
            {isOnline ? t('offline.reconnectingDesc') : t('offline.noConnectionDesc')}
          </p>

          <Button
            onClick={handleRetry}
            className="min-w-[200px] h-12 px-6"
            style={{ borderRadius: s('--md-sys-shape-corner-full') }}
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            {isOnline ? t('offline.continue') : t('offline.retry')}
          </Button>
        </section>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* IndexedDB Storage Card */}
          <div
            className="p-6"
            style={{
              background: s('--md-sys-color-surface-container'),
              borderRadius: s('--md-sys-shape-corner-medium'),
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: s('--md-sys-color-primary-container') }}
              >
                <HardDrive
                  className="w-5 h-5"
                  style={{ color: s('--md-sys-color-on-primary-container') }}
                  aria-hidden="true"
                />
              </div>
              <h2
                style={{
                  fontSize: s('--md-sys-typescale-title-small-size'),
                  fontWeight: s('--md-sys-typescale-title-small-weight'),
                  color: s('--md-sys-color-on-surface'),
                }}
              >
                {t('offline.storageTitle')}
              </h2>
            </div>

            {storageInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <span
                    className="flex items-center gap-2"
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      lineHeight: s('--md-sys-typescale-body-medium-line-height'),
                      color: s('--md-sys-color-on-surface-variant'),
                    }}
                  >
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                    {t('offline.storageMangas')}
                  </span>
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface'),
                    }}
                  >
                    {storageInfo.mangas}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span
                    className="flex items-center gap-2"
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      lineHeight: s('--md-sys-typescale-body-medium-line-height'),
                      color: s('--md-sys-color-on-surface-variant'),
                    }}
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    {t('offline.storageChapters')}
                  </span>
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface'),
                    }}
                  >
                    {storageInfo.chapters}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span
                    className="flex items-center gap-2"
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      lineHeight: s('--md-sys-typescale-body-medium-line-height'),
                      color: s('--md-sys-color-on-surface-variant'),
                    }}
                  >
                    <Database className="w-4 h-4" aria-hidden="true" />
                    {t('offline.storageActions')}
                  </span>
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface'),
                    }}
                  >
                    {storageInfo.actions}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: s('--md-sys-color-surface-container-high') }}
                role="progressbar"
                aria-label="Loading storage info"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: s('--md-sys-color-primary'),
                    width: '30%',
                    animation: 'loading-bar 2s ease-in-out infinite',
                  }}
                />
              </div>
            )}
          </div>

          {/* Browser Cache Card */}
          <div
            className="p-6"
            style={{
              background: s('--md-sys-color-surface-container'),
              borderRadius: s('--md-sys-shape-corner-medium'),
            }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: s('--md-sys-color-primary-container') }}
              >
                <ImageIcon
                  className="w-5 h-5"
                  style={{ color: s('--md-sys-color-on-primary-container') }}
                  aria-hidden="true"
                />
              </div>
              <h2
                style={{
                  fontSize: s('--md-sys-typescale-title-small-size'),
                  fontWeight: s('--md-sys-typescale-title-small-weight'),
                  color: s('--md-sys-color-on-surface'),
                }}
              >
                {t('offline.cacheInfo')}
              </h2>
            </div>

            {cacheLoading ? (
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: s('--md-sys-color-surface-container-high') }}
                role="progressbar"
                aria-label={t('offline.loadingCache')}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: s('--md-sys-color-primary'),
                    width: '30%',
                    animation: 'loading-bar 2s ease-in-out infinite',
                  }}
                />
              </div>
            ) : cacheInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface-variant'),
                    }}
                  >
                    {t('offline.staticCache')}
                  </span>
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface'),
                    }}
                  >
                    {formatBytes(cacheInfo.static)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface-variant'),
                    }}
                  >
                    {t('offline.imageCache')}
                  </span>
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface'),
                    }}
                  >
                    {formatBytes(cacheInfo.images)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface-variant'),
                    }}
                  >
                    {t('offline.apiCache')}
                  </span>
                  <span
                    style={{
                      fontSize: s('--md-sys-typescale-body-medium-size'),
                      fontWeight: s('--md-sys-typescale-body-medium-weight'),
                      color: s('--md-sys-color-on-surface'),
                    }}
                  >
                    {formatBytes(cacheInfo.api)}
                  </span>
                </div>
                <div
                  className="pt-3 mt-2"
                  style={{ borderTop: `1px solid ${s('--md-sys-color-outline-variant')}` }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: s('--md-sys-typescale-label-large-size'),
                        fontWeight: s('--md-sys-typescale-label-large-weight'),
                        color: s('--md-sys-color-on-surface'),
                      }}
                    >
                      {t('offline.totalCached')}
                    </span>
                    <span
                      style={{
                        fontSize: s('--md-sys-typescale-label-large-size'),
                        fontWeight: s('--md-sys-typescale-label-large-weight'),
                        color: s('--md-sys-color-primary'),
                      }}
                    >
                      {formatBytes(cacheInfo.total)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: s('--md-sys-color-error-container'),
                    color: s('--md-sys-color-on-error-container'),
                  }}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  {clearingCache ? `${t('offline.clearCache')}...` : cacheCleared ? `${t('offline.cacheCleared')} ✓` : t('offline.clearCache')}
                </button>
              </div>
            ) : (
              <p
                style={{
                  fontSize: s('--md-sys-typescale-body-medium-size'),
                  fontWeight: s('--md-sys-typescale-body-medium-weight'),
                  color: s('--md-sys-color-on-surface-variant'),
                }}
              >
                Service Worker no disponible
              </p>
            )}
          </div>
        </div>

        {/* Saved Mangas Section */}
        {!isOnline && savedMangas.length > 0 && (
          <section className="mb-12">
            <h2
              className="flex items-center gap-3 mb-6"
              style={{
                fontSize: s('--md-sys-typescale-title-medium-size'),
                fontWeight: s('--md-sys-typescale-title-medium-weight'),
                color: s('--md-sys-color-on-surface'),
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: s('--md-sys-color-primary-container') }}
              >
                <BookOpen
                  className="w-4 h-4"
                  style={{ color: s('--md-sys-color-on-primary-container') }}
                  aria-hidden="true"
                />
              </div>
              {t('offline.savedContent')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {savedMangas.map((manga) => (
                <Link key={manga.id} href={`/manga/${manga.slug}`} className="group block">
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{
                      background: s('--md-sys-color-surface-container-high'),
                      borderRadius: s('--md-sys-shape-corner-medium'),
                    }}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {manga.coverUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: s('--md-sys-color-surface-container-lowest') }}
                        >
                          <BookOpen
                            className="w-8 h-8"
                            style={{ color: s('--md-sys-color-on-surface-variant') }}
                            aria-hidden="true"
                          />
                        </div>
                      )}
                      <div
                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs font-medium"
                        style={{
                          background: s('--md-sys-color-primary'),
                          color: s('--md-sys-color-on-primary'),
                          borderRadius: s('--md-sys-shape-corner-extra-small'),
                        }}
                      >
                        <Download className="w-3 h-3" aria-hidden="true" />
                        Offline
                      </div>
                    </div>
                    <div className="p-3">
                      <h3
                        className="truncate"
                        style={{
                          fontSize: s('--md-sys-typescale-body-medium-size'),
                          fontWeight: s('--md-sys-typescale-body-medium-weight'),
                          lineHeight: 1.3,
                          color: s('--md-sys-color-on-surface'),
                        }}
                      >
                        {manga.title}
                      </h3>
                      <p
                        className="mt-1"
                        style={{
                          fontSize: s('--md-sys-typescale-body-small-size'),
                          fontWeight: s('--md-sys-typescale-body-small-weight'),
                          color: s('--md-sys-color-on-surface-variant'),
                        }}
                      >
                        Cap. {manga.lastChapter}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* No Saved Content */}
        {!isOnline && savedMangas.length === 0 && !isLoading && (
          <div
            className="flex flex-col items-center text-center p-10 mb-12"
            style={{
              background: s('--md-sys-color-surface-container'),
              borderRadius: s('--md-sys-shape-corner-medium'),
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: s('--md-sys-color-surface-container-high') }}
            >
              <AlertCircle
                className="w-8 h-8"
                style={{ color: s('--md-sys-color-on-surface-variant') }}
              />
            </div>
            <h3
              className="mb-2"
              style={{
                fontSize: s('--md-sys-typescale-title-medium-size'),
                fontWeight: s('--md-sys-typescale-title-medium-weight'),
                color: s('--md-sys-color-on-surface'),
              }}
            >
              {t('offline.noSavedContent')}
            </h3>
            <p
              className="max-w-sm"
              style={{
                fontSize: s('--md-sys-typescale-body-medium-size'),
                fontWeight: s('--md-sys-typescale-body-medium-weight'),
                lineHeight: s('--md-sys-typescale-body-medium-line-height'),
                color: s('--md-sys-color-on-surface-variant'),
              }}
            >
              {t('offline.noSavedContentDesc')}
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8" role="status">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{
                border: `3px solid ${s('--md-sys-color-outline-variant')}`,
                borderTopColor: s('--md-sys-color-primary'),
              }}
              aria-label="Loading"
            />
          </div>
        )}

        {/* Tips Section */}
        <div
          className="p-6"
          style={{
            background: s('--md-sys-color-surface-container'),
            borderRadius: s('--md-sys-shape-corner-medium'),
          }}
        >
          <h3
            className="flex items-center gap-3 mb-4"
            style={{
              fontSize: s('--md-sys-typescale-title-small-size'),
              fontWeight: s('--md-sys-typescale-title-small-weight'),
              color: s('--md-sys-color-on-surface'),
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: s('--md-sys-color-primary-container') }}
            >
              <AlertCircle
                className="w-4 h-4"
                style={{ color: s('--md-sys-color-on-primary-container') }}
                aria-hidden="true"
              />
            </div>
            {t('offline.tips')}
          </h3>
          <ul
            className="space-y-2 list-disc list-inside"
            style={{
              fontSize: s('--md-sys-typescale-body-medium-size'),
              fontWeight: s('--md-sys-typescale-body-medium-weight'),
              lineHeight: s('--md-sys-typescale-body-medium-line-height'),
              color: s('--md-sys-color-on-surface-variant'),
            }}
          >
            <li>{t('offline.tip1')}</li>
            <li>{t('offline.tip2')}</li>
            <li>{t('offline.tip3')}</li>
            <li>{t('offline.tip4')}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
