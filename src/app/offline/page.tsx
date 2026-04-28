'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, BookOpen, Download, AlertCircle } from 'lucide-react';
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

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [savedMangas, setSavedMangas] = useState<SavedManga[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
    };

    checkConnection();
    loadSavedMangas();

    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

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

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500",
            isOnline ? "bg-green-500/20" : "bg-amber-500/20"
          )}>
            {isOnline ? (
              <RefreshCw className="w-12 h-12 text-green-400 animate-spin" />
            ) : (
              <WifiOff className="w-12 h-12 text-amber-400" />
            )}
          </div>
        </div>

        {/* Status Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          {isOnline ? '¡Conexión restaurada!' : 'Sin conexión a internet'}
        </h1>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          {isOnline 
            ? 'Tu conexión ha vuelto. Puedes continuar navegando normalmente.'
            : 'Parece que has perdido la conexión. Puedes seguir leyendo los capítulos que hayas guardado para modo offline.'
          }
        </p>

        {/* Retry Button */}
        <div className="mb-12">
          <Button 
            onClick={handleRetry}
            className="min-w-[200px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isOnline ? 'Continuar' : 'Reintentar'}
          </Button>
        </div>

        {/* Saved Mangas Section */}
        {!isOnline && savedMangas.length > 0 && (
          <div className="text-left">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent-blue" />
              Disponible offline
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {savedMangas.map((manga) => (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.slug}`}
                  className="group"
                >
                  <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-accent-blue transition-colors">
                    <div className="aspect-[3/4] relative overflow-hidden">
                      {manga.coverUrl ? (
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Offline
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-white text-sm truncate">
                        {manga.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Cap. {manga.lastChapter}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Saved Content */}
        {!isOnline && savedMangas.length === 0 && !isLoading && (
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No hay contenido guardado
            </h3>
            <p className="text-slate-400 text-sm">
              Cuando tengas conexión, guarda tus mangas favoritos para leerlos sin internet.
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-8 h-8 text-slate-500 animate-spin" />
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-left">
          <h3 className="font-medium text-white mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-blue" />
            Consejos para modo offline
          </h3>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>Guarda capítulos desde el lector para leerlos sin conexión</li>
            <li>Los capítulos guardados expiran después de 7 días</li>
            <li>Tu progreso se sincronizará cuando vuelvas a tener conexión</li>
            <li>Usa WiFi para guardar capítulos y ahorrar datos móviles</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
