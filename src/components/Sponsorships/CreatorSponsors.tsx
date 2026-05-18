'use client';

import { Crown, Coins, User, MessageSquare, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface SponsorData {
  mangas: Array<{
    id: string;
    title: string;
    slug: string;
    chapters: Array<{
      id: string;
      chapterNumber: number;
      title: string | null;
      sponsorshipBids: Array<{
        id: string;
        bidAmount: number;
        sponsorName: string | null;
        message: string | null;
        createdAt: string;
        user: { id: string; username: string; avatarUrl: string | null };
      }>;
    }>;
  }>;
  recentBids: Array<{
    id: string;
    bidAmount: number;
    status: string;
    sponsorName: string | null;
    message: string | null;
    createdAt: string;
    user: { id: string; username: string; avatarUrl: string | null };
    chapter: { id: string; chapterNumber: number; title: string | null; manga: { title: string; slug: string } };
  }>;
}

export function CreatorSponsors({ mangas, recentBids }: SponsorData) {
  const activeBids = recentBids.filter(b => b.status === 'ACTIVE');

  return (
    <div className="space-y-8">
      {activeBids.length > 0 && (
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Crown size={20} className="text-[var(--warning)]" />
            Patrocinios Activos
          </h2>
          <div className="space-y-3">
            {activeBids.map((bid) => (
              <div key={bid.id} className="bg-secondary border border-custom rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center shrink-0 overflow-hidden">
                      {bid.user.avatarUrl ? (
                        <img src={bid.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-muted" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{bid.sponsorName || bid.user.username}</p>
                      <p className="text-xs text-muted">
                        {bid.chapter.manga.title} · Cap. {bid.chapter.chapterNumber}
                      </p>
                      {bid.message && (
                        <p className="text-xs text-muted italic mt-1 flex items-center gap-1">
                          <MessageSquare size={12} />"{bid.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-[var(--warning)] flex items-center gap-1 justify-end">
                      <Coins size={14} />
                      {bid.bidAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">{new Date(bid.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {mangas.map((manga) => {
        const chaptersWithBids = manga.chapters.filter(c => c.sponsorshipBids.length > 0);
        if (chaptersWithBids.length === 0) return null;

        return (
          <section key={manga.id}>
            <h2 className="text-lg font-bold mb-4">
              <Link href={`/manga/${manga.slug}`} className="hover:underline flex items-center gap-2">
                {manga.title} <ExternalLink size={14} className="text-muted" />
              </Link>
            </h2>
            <div className="space-y-3">
              {chaptersWithBids.map((chapter) => (
                <div key={chapter.id} className="bg-secondary border border-custom rounded-xl p-4">
                  <p className="text-sm font-semibold mb-3">Capítulo {chapter.chapterNumber}{chapter.title ? ` - ${chapter.title}` : ''}</p>
                  <div className="space-y-2">
                    {chapter.sponsorshipBids.map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between text-sm bg-tertiary rounded-lg px-3 py-2">
                        <span className="font-medium">{bid.sponsorName || bid.user.username}</span>
                        <span className="font-mono text-[var(--warning)]">{bid.bidAmount.toLocaleString()} IC</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {mangas.every(m => m.chapters.every(c => c.sponsorshipBids.length === 0)) && (
        <div className="text-center py-16">
          <Crown size={48} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Sin patrocinios aún</h2>
          <p className="text-muted">Los lectores pueden patrocinar tus capítulos para apoyarte</p>
        </div>
      )}
    </div>
  );
}
