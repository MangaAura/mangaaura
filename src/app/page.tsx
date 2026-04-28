'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Layout/Navbar';
import { TrendingUp, Clock, Star, Flame, ChevronRight, Play } from 'lucide-react';

// Dynamic imports for heavy components
const NavbarLazy = dynamic(() => import('@/components/Layout/Navbar'), {
  ssr: true,
});

interface LatestManga {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  updatedAt: string;
  chapterCount: number;
  tags: string[];
}

interface RankingManga {
  rank: number;
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  totalViews: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Memoized time formatter component
const FormatTime = memo(function FormatTime({ dateString }: { dateString: string }) {
  const formatted = useMemo(() => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  }, [dateString]);

  return <>{formatted}</>;
});

// Memoized views formatter
const formatViews = (views: number): string => {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
  return views.toString();
};

// Memoized manga card component for latest updates
const LatestMangaCard = memo(function LatestMangaCard({ manga, index }: { manga: LatestManga; index: number }) {
  return (
    <Link href={`/manga/${manga.slug || manga.id}`} className="group" prefetch={true}>
      <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-xl shadow-sm border border-custom group-hover:border-accent-blue transition-colors">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            loading={index < 4 ? 'eager' : 'lazy'}
            priority={index < 2}
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <span className="text-4xl font-bold text-muted">{manga.title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
          <span className="text-xs font-bold text-white bg-accent-blue/80 px-2 py-0.5 rounded backdrop-blur-sm">Ch. {manga.chapterCount}</span>
        </div>
      </div>
      <h4 className="font-bold text-sm leading-tight group-hover:text-accent-blue transition-colors line-clamp-1">{manga.title}</h4>
      <p className="text-xs text-muted mt-1"><FormatTime dateString={manga.updatedAt} /></p>
    </Link>
  );
});

// Memoized ranking item component
const RankingItem = memo(function RankingItem({ manga, index }: { manga: RankingManga; index: number }) {
  const rankColor = useMemo(() => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-orange-500';
    return 'text-muted';
  }, [index]);

  return (
    <Link href={`/manga/${manga.slug || manga.id}`} className="flex items-center gap-4 group p-2 hover:bg-tertiary rounded-xl transition-colors" prefetch={true}>
      <div className={`w-6 text-center font-black text-lg ${rankColor}`}>
        {index + 1}
      </div>
      {manga.coverUrl ? (
        <Image
          src={manga.coverUrl}
          alt={manga.title}
          width={48}
          height={64}
          className="w-12 h-16 rounded object-cover shadow-sm"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-16 rounded bg-secondary flex items-center justify-center shadow-sm">
          <span className="text-lg font-bold text-muted">{manga.title.charAt(0)}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate group-hover:text-accent-blue transition-colors">{manga.title}</h4>
        <p className="text-xs text-muted">{formatViews(manga.totalViews)} vistas</p>
      </div>
    </Link>
  );
});

// Skeleton loaders
const LatestUpdatesSkeleton = memo(function LatestUpdatesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] bg-secondary rounded-xl mb-3" />
          <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
          <div className="h-3 bg-secondary rounded w-1/2" />
        </div>
      ))}
    </div>
  );
});

const RankingsSkeleton = memo(function RankingsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-6 h-6 bg-tertiary rounded" />
          <div className="w-12 h-16 bg-tertiary rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-tertiary rounded w-3/4" />
            <div className="h-3 bg-tertiary rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

export default function Home() {
  const [rankingTab, setRankingTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Fetch latest updates - using search API with sort=updated for public manga list
  const { data: latestData, isLoading: latestLoading } = useSWR(
    '/api/search?sort=updated&limit=6',
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Dedupe requests within 1 minute
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  // Fetch rankings
  const { data: rankingsData, isLoading: rankingsLoading } = useSWR(
    '/api/rankings?type=popularity&limit=5',
    fetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 300000,
    }
  );

  const latestUpdates: LatestManga[] = latestData?.results || latestData?.mangas || [];
  const rankings: RankingManga[] = rankingsData?.results || rankingsData?.mangas || [];

  // Memoized tab change handler
  const handleTabChange = useCallback((tab: 'daily' | 'weekly' | 'monthly') => {
    setRankingTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-secondary overflow-hidden border-b border-custom">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image 
            src="https://via.placeholder.com/1920x600/10121a/5a6072?text=Featured+Manga+Banner" 
            alt="Banner" 
            fill
            priority
            className="object-cover blur-sm"
            sizes="100vw"
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-48 h-72 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-custom rotate-[-2deg] transition-transform hover:rotate-0 relative">
            <Image 
              src="https://via.placeholder.com/400x600/eef0f3/5a6072?text=Solo+Leveling" 
              alt="Solo Leveling" 
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 192px, 400px"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1 bg-accent-red/20 text-accent-red text-xs font-bold px-3 py-1 rounded-full mb-4 border border-accent-red/30">
              <Flame size={14} /> TENDENCIA #1
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">Solo Leveling</h1>
            <p className="text-muted text-lg md:text-xl mb-8 max-w-2xl drop-shadow">
              Hace diez años, se abrió "la Puerta" que conectaba el mundo real con el mundo de los monstruos. Algunas personas ordinarias recibieron el poder de cazar monstruos...
            </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Link href="/reader" prefetch={true}>
              <button className="bg-accent-blue hover:bg-accent-blue-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent-blue/30 flex items-center gap-2">
                <Play fill="currentColor" size={18} /> Leer Capítulo 1
              </button>
            </Link>
            <Link href="/manga/solo-leveling" prefetch={true}>
              <button className="bg-tertiary hover:bg-secondary text-fg-primary border border-custom px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                Ver Detalles
              </button>
            </Link>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left Column: Updates & News */}
        <div className="lg:col-span-2 space-y-10">

          {/* Latest Updates */}
          <section>
            <div className="flex justify-between items-center mb-6 border-b border-custom pb-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Clock className="text-accent-blue" /> Últimas Actualizaciones
              </h2>
              <button className="text-sm font-semibold text-accent-blue hover:underline flex items-center">
                Ver todo <ChevronRight size={16} />
              </button>
            </div>

        {latestLoading ? (
          <LatestUpdatesSkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {latestUpdates.map((manga, i) => (
              <LatestMangaCard key={manga.id || i} manga={manga} index={i} />
            ))}
          </div>
        )}
          </section>

          {/* News Section */}
          <section>
            <div className="flex justify-between items-center mb-6 border-b border-custom pb-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="text-yellow-500" /> Noticias de InkVerse
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary border border-custom rounded-xl p-5 hover:border-accent-purple transition-colors cursor-pointer group">
                <div className="bg-accent-purple/10 text-accent-purple text-xs font-bold inline-block px-2 py-1 rounded mb-3">COMUNIDAD</div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-accent-purple transition-colors">¡Arranca la Temporada 3 de Clanes!</h3>
                <p className="text-sm text-muted line-clamp-2">Reúne a tu gremio y preparaos para la nueva batalla por InkCoins. Nuevas recompensas añadidas al pozo.</p>
              </div>
              <div className="bg-secondary border border-custom rounded-xl p-5 hover:border-accent-blue transition-colors cursor-pointer group">
                <div className="bg-accent-blue/10 text-accent-blue text-xs font-bold inline-block px-2 py-1 rounded mb-3">PLATAFORMA</div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-accent-blue transition-colors">Nuevo Lector Paged Mode</h3>
                <p className="text-sm text-muted line-clamp-2">Basado en vuestro feedback, hemos pulido el sistema de lectura por páginas para consumir menos RAM en móviles.</p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Rankings */}
        <div className="lg:col-span-1">
          <div className="bg-secondary border border-custom rounded-2xl p-5 sticky top-24">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="text-accent-red" /> Top Rankings
            </h2>

        <div className="flex bg-tertiary rounded-lg p-1 mb-5">
          <button
            onClick={() => handleTabChange('daily')}
            className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${rankingTab === 'daily' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'}`}
          >
            Diario
          </button>
          <button
            onClick={() => handleTabChange('weekly')}
            className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${rankingTab === 'weekly' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'}`}
          >
            Semanal
          </button>
          <button
            onClick={() => handleTabChange('monthly')}
            className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${rankingTab === 'monthly' ? 'bg-secondary shadow-sm text-fg-primary' : 'text-muted hover:text-fg-primary'}`}
          >
            Mensual
          </button>
        </div>

        {rankingsLoading ? (
          <RankingsSkeleton />
        ) : (
          <div className="space-y-4">
            {rankings.map((manga, i) => (
              <RankingItem key={manga.id || i} manga={manga} index={i} />
            ))}
          </div>
        )}

            <button className="w-full mt-4 py-2 border border-custom text-xs font-bold rounded-lg hover:bg-tertiary transition-colors">
              Ver Ranking Completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
