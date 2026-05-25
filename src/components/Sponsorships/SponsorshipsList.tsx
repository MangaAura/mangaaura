'use client';

import { Crown, Clock, CheckCircle2, XCircle, Coins, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { useT } from '@/i18n';

interface BidData {
  id: string;
  bidAmount: number;
  status: string;
  isWinning: boolean;
  sponsorName: string | null;
  message: string | null;
  createdAt: string;
  chapter: {
    id: string;
    chapterNumber: number;
    title: string | null;
    manga: { id: string; title: string; slug: string };
  };
}

export function SponsorshipsList({ activeBids, wonBids, history }: { activeBids: BidData[]; wonBids: BidData[]; history: BidData[] }) {
  const t = useT();
  return (
    <div className="space-y-8">
      {activeBids.length > 0 && (
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Crown size={20} className="text-[var(--warning)]" />
            {t('sponsorships.activeBids')}
            <span className="text-xs bg-[var(--warning)]/10 text-[var(--warning)] px-2 py-0.5 rounded-full">{activeBids.length}</span>
          </h2>
          <div className="space-y-3">
            {activeBids.map((bid) => (
              <BidCard key={bid.id} bid={bid} type="active" />
            ))}
          </div>
        </section>
      )}

      {wonBids.length > 0 && (
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-accent-green" />
            {t('sponsorships.wonSponsorships')}
          </h2>
          <div className="space-y-3">
            {wonBids.map((bid) => (
              <BidCard key={bid.id} bid={bid} type="won" />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Clock size={20} className="text-muted" />
            {t('sponsorships.history')}
          </h2>
          <div className="space-y-3">
            {history.map((bid) => (
              <BidCard key={bid.id} bid={bid} type="history" />
            ))}
          </div>
        </section>
      )}

      {activeBids.length === 0 && wonBids.length === 0 && history.length === 0 && (
        <div className="text-center py-16">
          <Crown size={48} className="mx-auto text-muted mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">{t('sponsorships.noSponsorships')}</h2>
          <p className="text-muted mb-6">{t('sponsorships.sponsorToAppear')}</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-tertiary hover:bg-custom border border-custom px-6 py-3 rounded-xl font-semibold transition-colors">
            {t('sponsorships.exploreMangas')} <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

function BidCard({ bid, type }: { bid: BidData; type: 'active' | 'won' | 'history' }) {
  const statusIcon = type === 'active' ? <Crown size={16} className="text-[var(--warning)]" /> : type === 'won' ? <CheckCircle2 size={16} className="text-accent-green" /> : <XCircle size={16} className="text-muted" />;

  return (
    <Link href={`/manga/${bid.chapter.manga.slug}/${bid.chapter.id}`} className="block bg-secondary border border-custom rounded-xl p-4 hover:bg-tertiary transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusIcon}
            <span className="font-semibold truncate">{bid.chapter.manga.title}</span>
          </div>
          <p className="text-sm text-muted">
            Capítulo {bid.chapter.chapterNumber}{bid.chapter.title ? ` - ${bid.chapter.title}` : ''}
          </p>
          {bid.message && <p className="text-xs text-muted italic mt-1 truncate">"{bid.message}"</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono font-bold text-[var(--warning)] flex items-center gap-1 justify-end">
            <Coins size={14} />
            {bid.bidAmount.toLocaleString()}
          </p>
          <p className="text-xs text-muted">{new Date(bid.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </Link>
  );
}
