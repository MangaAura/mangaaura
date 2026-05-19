'use client';

import { BookOpen, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';

import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';

interface ReadingEntry {
  id: string;
  percentage: number;
  completed: boolean;
  completedAt: string | null;
  updatedAt: string;
  createdAt: string;
  durationSeconds: number;
  manga: { id: string; title: string; slug: string; coverUrl: string | null };
  chapter: { id: string; chapterNumber: number; title: string | null };
}

export function ReadingHistoryClient({ progress }: { progress: ReadingEntry[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

  const filtered = useMemo(() => {
    return progress.filter((entry) => {
      if (filter === 'completed' && !entry.completed) return false;
      if (filter === 'in-progress' && entry.completed) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          entry.manga.title.toLowerCase().includes(q) ||
          entry.chapter.title?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [progress, search, filter]);

  const groupedByManga = useMemo(() => {
    const map = new Map<string, { manga: ReadingEntry['manga']; chapters: ReadingEntry[] }>();
    for (const entry of filtered) {
      const existing = map.get(entry.manga.id);
      if (existing) {
        existing.chapters.push(entry);
      } else {
        map.set(entry.manga.id, { manga: entry.manga, chapters: [entry] });
      }
    }
    return Array.from(map.values());
  }, [filtered]);

  if (progress.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen size={48} className="mx-auto text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Sin historial aún</h2>
        <p className="text-muted mb-6">Los capítulos que leas aparecerán aquí</p>
        <Link href="/browse" className="inline-flex items-center gap-2 bg-tertiary hover:bg-custom border border-custom px-6 py-3 rounded-xl font-semibold transition-colors">
          Explorar mangas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por manga o capítulo..."
            aria-label="Buscar en historial de lectura"
            className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-custom rounded-xl text-sm outline-none focus:border-accent-blue transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'completed', 'in-progress'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                filter === f ? 'bg-accent-blue text-white border-accent-blue' : 'bg-secondary border-custom hover:bg-tertiary'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'En progreso'}
            </button>
          ))}
        </div>
      </div>

      <StaggerContainer className="space-y-4" staggerDelay={0.06}>
      {groupedByManga.map(({ manga, chapters }) => (
        <StaggerItem key={manga.id}>
        <div className="bg-secondary border border-custom rounded-xl overflow-hidden">
          <Link href={`/manga/${manga.slug}`} className="flex items-center gap-3 p-4 bg-tertiary/50 hover:bg-tertiary transition-colors border-b border-custom">
            {manga.coverUrl ? (
              <img src={manga.coverUrl} alt="" className="w-10 h-14 rounded object-cover" />
            ) : (
              <div className="w-10 h-14 rounded bg-background flex items-center justify-center"><BookOpen size={18} className="text-muted" /></div>
            )}
            <div>
              <p className="font-bold">{manga.title}</p>
              <p className="text-xs text-muted">{chapters.length} capítulo{chapters.length !== 1 ? 's' : ''}</p>
            </div>
          </Link>
          <div className="divide-y divide-custom">
            {chapters.map((entry) => (
              <Link key={entry.id} href={`/manga/${manga.slug}/${entry.chapter.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-tertiary transition-colors group/link">
                <div className="flex items-center gap-3 min-w-0">
                  {entry.completed ? (
                    <CheckCircle size={16} className="shrink-0 text-accent-green" />
                  ) : (
                    <Clock size={16} className="shrink-0 text-[var(--warning)]" />
                  )}
                  <span className="text-sm truncate">
                    Capítulo {entry.chapter.chapterNumber}{entry.chapter.title ? ` - ${entry.chapter.title}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {!entry.completed && (
                    <span className="text-xs text-muted">{Math.round(entry.percentage)}%</span>
                  )}
                  <span className="text-xs text-muted">{new Date(entry.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </StaggerItem>
      ))}
      </StaggerContainer>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted">
          <Filter size={24} className="mx-auto mb-2 opacity-50" />
          <p>No hay resultados con los filtros actuales</p>
        </div>
      )}
    </div>
  );
}
