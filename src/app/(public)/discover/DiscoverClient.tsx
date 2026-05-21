'use client';

import { TrendingUp, Clock, Star, Sparkles, Eye, BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';

interface MangaItem {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  status: string;
  rating: number | null;
  totalViews: number;
  _count: { chapters: number };
}

interface DiscoverClientProps {
  trending: MangaItem[];
  recent: MangaItem[];
  topRated: MangaItem[];
  featuredManga: MangaItem | null;
}

export function DiscoverClient({ trending, recent, topRated, featuredManga }: DiscoverClientProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Sparkles className="text-[var(--primary)]" size={30} /> Descubrir
        </h1>
        <p className="text-muted">Explora nuevos mangas, tendencias y recomendaciones</p>
      </div>

      {featuredManga && (
        <Link href={`/manga/${featuredManga.slug}`} className="block mb-10 group">
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-accent-blue/20 via-accent-purple/20 to-[var(--warning)]/10 border border-custom">
            <div className="absolute inset-0 flex items-center p-8 md:p-12">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-xs text-[var(--warning)] font-bold uppercase mb-2">
                  <Sparkles size={14} /> Destacado
                </div>
                <h2 className="text-2xl md:text-4xl font-bold mb-2">{featuredManga.title}</h2>
                <p className="text-sm text-muted mb-4 line-clamp-2">
                  {featuredManga._count.chapters} capítulo{featuredManga._count.chapters !== 1 ? 's' : ''}
                  {featuredManga.rating ? ` · ${featuredManga.rating.toFixed(1)} ★` : ''}
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-tertiary hover:bg-custom border border-custom rounded-xl text-sm font-semibold transition-colors group-hover:translate-x-1 duration-200">
                  Leer ahora <ArrowRight size={16} />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      <Section title="Tendencias" icon={<TrendingUp size={18} className="text-accent-red" />} manga={trending} />
      <Section title="Mejor calificados" icon={<Star size={18} className="text-[var(--warning)]" />} manga={topRated} />
      <Section title="Recién agregados" icon={<Clock size={18} className="text-accent-blue" />} manga={recent} />
    </div>
  );
}

function Section({ title, icon, manga }: { title: string; icon: React.ReactNode; manga: MangaItem[] }) {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">{icon} {title}</h2>
        <Link href="/explore" className="text-sm text-accent-blue hover:underline font-semibold">Ver todo</Link>
      </div>
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" staggerDelay={0.04}>
        {manga.map((m) => (
          <StaggerItem key={m.id}>
            <Link href={`/manga/${m.slug}`} className="group">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-tertiary border border-custom mb-2">
                {m.coverUrl ? (
                  <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={24} className="text-muted" />
                  </div>
                )}
              </div>
              <h3 className="text-sm font-semibold truncate">{m.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted">
                {m.rating && <span className="flex items-center gap-0.5"><Star size={10} />{m.rating.toFixed(1)}</span>}
                <span className="flex items-center gap-0.5"><Eye size={10} />{m.totalViews}</span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
