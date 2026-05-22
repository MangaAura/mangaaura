'use client';

import { Coins, Send, Inbox, User, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface TipEntry {
  id: string;
  amount: number;
  message: string | null;
  createdAt: string;
  toUser: { id: string; username: string; avatarUrl: string | null };
  fromUser: { id: string; username: string; avatarUrl: string | null };
  chapter: { chapterNumber: number; manga: { title: string; slug: string } };
}

export function TipsClient({ sent, received }: { sent: TipEntry[]; received: TipEntry[] }) {
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [search, setSearch] = useState('');

  const data = tab === 'sent' ? sent : received;

  const filtered = search
    ? data.filter((t) => {
        const other = tab === 'sent' ? t.toUser.username : t.fromUser.username;
        return other.toLowerCase().includes(search.toLowerCase()) || t.chapter.manga.title.toLowerCase().includes(search.toLowerCase());
      })
    : data;

  if (sent.length === 0 && received.length === 0) {
    return (
      <div className="text-center py-16">
        <Coins size={48} className="mx-auto text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Sin propinas aún</h2>
        <p className="text-muted mb-6">Podés dar propinas a los creadores de los capítulos que leas</p>
        <Link href="/explore" className="inline-flex items-center gap-2 bg-tertiary hover:bg-custom border border-custom px-6 py-3 rounded-xl font-semibold transition-colors">
          Explorar mangas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
            tab === 'sent' ? 'bg-accent-blue text-white border-accent-blue' : 'bg-secondary border-custom hover:bg-tertiary'
          }`}
        >
          <Send size={16} /> Enviadas ({sent.length})
        </button>
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
            tab === 'received' ? 'bg-accent-blue text-white border-accent-blue' : 'bg-secondary border-custom hover:bg-tertiary'
          }`}
        >
          <Inbox size={16} /> Recibidas ({received.length})
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuario o manga..."
          className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-custom rounded-xl text-sm outline-none focus:border-accent-blue transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p>No se encontraron resultados</p>
        </div>
      ) : (
        <div className="divide-y divide-custom bg-secondary border border-custom rounded-xl overflow-hidden">
          {filtered.map((tip) => {
            const other = tab === 'sent' ? tip.toUser : tip.fromUser;
            return (
              <Link key={tip.id} href={`/manga/${tip.chapter.manga.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-tertiary transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center shrink-0 overflow-hidden">
                    {other.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={other.avatarUrl} alt={`Avatar de ${other.username}`} className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-muted" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{other.username}</p>
                    <p className="text-xs text-muted truncate">
                      Cap. {tip.chapter.chapterNumber} · {tip.chapter.manga.title}
                    </p>
                    {tip.message && <p className="text-xs text-muted italic truncate">&quot;{tip.message}&quot;</p>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono font-bold text-[var(--warning)] flex items-center gap-1 justify-end">
                    <Coins size={14} />
                    {tip.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted">{new Date(tip.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
