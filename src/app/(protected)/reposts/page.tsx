'use client';

import { Repeat2, Loader2, BookOpen, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import useSWR from 'swr';

import { RepostButton } from '@/components/Repost/RepostButton';
import { fetcher } from '@/lib/swr-config';

const typeIcons: Record<string, typeof BookOpen> = {
  MANGA: BookOpen,
  CHAPTER: BookOpen,
  COMMENT: MessageSquare,
};

const typeLabels: Record<string, string> = {
  MANGA: 'Manga',
  CHAPTER: 'Capítulo',
  COMMENT: 'Comentario',
};

export default function RepostsPage() {
  interface RepostItem {
  id: string;
  originalType: string;
  originalId: string;
  createdAt: string;
  comment?: string;
}

const { data, error } = useSWR<{ reposts: RepostItem[] }>('/api/reposts', fetcher, { refreshInterval: 10000 });
  const [filter, setFilter] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (error) return <div className="max-w-3xl mx-auto px-4 py-8 text-center text-muted">Error al cargar reposts</div>;
  if (!data) return <div className="max-w-3xl mx-auto px-4 py-8" role="status"><Loader2 size={24} className="animate-spin mx-auto text-muted" /></div>;

  const reposts = data.reposts || [];
  const filtered = filter ? reposts.filter((r: { originalType: string }) => r.originalType === filter) : reposts;
  const types = [...new Set(reposts.map((r: { originalType: string }) => r.originalType))] as string[];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Repeat2 className="text-[var(--primary)]" size={30} /> Reposts
        </h1>
        <p className="text-muted">Contenido que has compartido</p>
      </div>

      {reposts.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => startTransition(() => setFilter(null))} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${!filter ? 'bg-accent-blue text-white border-accent-blue' : 'bg-secondary border-custom hover:bg-tertiary'}`}>
            Todos ({reposts.length})
          </button>
          {types.map((t) => {
            const count = reposts.filter((r: { originalType: string }) => r.originalType === t).length;
            return (
              <button key={t} onClick={() => startTransition(() => setFilter(t))} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${filter === t ? 'bg-accent-blue text-white border-accent-blue' : 'bg-secondary border-custom hover:bg-tertiary'}`}>
                {typeLabels[t] || t} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Repeat2 size={48} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Sin reposts aún</h2>
          <p className="text-muted mb-6">Compartí mangas y capítulos que te gusten</p>
          <Link href="/explore" className="inline-flex items-center gap-2 bg-tertiary hover:bg-custom border border-custom px-6 py-3 rounded-xl font-semibold transition-colors">
            Explorar mangas
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((repost: { id: string; originalType: string; originalId: string; createdAt: string; comment?: string }) => {
            const Icon = typeIcons[repost.originalType] || BookOpen;
            return (
              <div key={repost.id} className="bg-secondary border border-custom rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-muted" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted">{typeLabels[repost.originalType] || repost.originalType}</p>
                    <p className="text-sm font-semibold truncate">ID: {repost.originalId.slice(0, 12)}...</p>
                    {repost.comment && <p className="text-xs text-muted italic truncate">&quot;{repost.comment}&quot;</p>}
                    <p className="text-xs text-muted">{new Date(repost.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RepostButton originalType={repost.originalType as 'MANGA' | 'CHAPTER' | 'COMMENT'} originalId={repost.originalId} initialReposted={true} />
                  <Link href={`?id=${repost.originalId}`} className="p-2 rounded-lg bg-tertiary hover:bg-custom border border-custom transition-colors">
                    <ExternalLink size={14} className="text-muted" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
