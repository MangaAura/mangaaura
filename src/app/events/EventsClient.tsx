'use client';

import {
  Palette,
  Trophy,
  Star,
  ThumbsUp,
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { EventCard, eventStatusBadge } from '@/components/Event/EventCard';
import type { EventData } from '@/components/Event/EventCard';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useT } from '@/i18n';

interface SubData {
  id: string;
  eventId: string;
  userId: string;
  imageUrl: string;
  prompt: string | null;
  votes: number;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface VotingData {
  event: EventData;
  submissions: SubData[];
}

interface EventsClientProps {
  initialTab: string;
  events: EventData[];
  totalEvents: number;
  page: number;
  limit: number;
  voting: VotingData | null;
  initialVotedId: string | null;
  userId: string | null;
  search: string;
  typeFilter: string;
  highlight: string;
  types: readonly string[];
}

export function EventsClient({
  initialTab,
  events,
  totalEvents,
  page,
  limit,
  voting,
  initialVotedId,
  userId,
  search,
  typeFilter,
  highlight: _highlight,
  types,
}: EventsClientProps) {
  const t = useT();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [votedId, setVotedId] = useState<string | null>(initialVotedId);
  const [localVoting, setLocalVoting] = useState<VotingData | null>(voting);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);

  const totalPages = Math.ceil(totalEvents / limit);

  const buildUrl = (overrides: Record<string, string>) => {
    const p = new URLSearchParams(window.location.search);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `?${p.toString()}`;
  };

  const navigateTab = (tab: string) => {
    setActiveTab(tab);
    const url = buildUrl({ tab, page: '1' });
    router.push(url);
  };

  const navigatePage = (newPage: number) => {
    const url = buildUrl({ page: String(newPage) });
    router.push(url);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const url = buildUrl({ type: val, page: '1' });
    router.push(url);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const url = buildUrl({ search: q, page: '1' });
    router.push(url);
  };

  const handleVote = async (submissionId: string, eventId: string) => {
    setVoteError(null);
    setVotingLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.voted) {
          setVotedId(submissionId);
        } else {
          setVotedId(null);
        }
        setLocalVoting((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            submissions: prev.submissions.map((s) =>
              s.id === submissionId ? { ...s, votes: data.votes } : s
            ),
          };
        });
      }
    } catch {
      setVoteError(t('events.voteError'));
    } finally {
      setVotingLoading(false);
    }
  };

  const typeLabel = (typeVal: string) => {
    switch (typeVal) {
      case 'ART_CHALLENGE': return `🎨 ${t('events.typeLabel.artChallenge')}`;
      case 'SPEEDREADING': return `⚡ ${t('events.typeLabel.speedReading')}`;
      case 'COMMUNITY': return `👥 ${t('events.typeLabel.community')}`;
      default: return typeVal;
    }
  };

  return (
    <>
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[var(--accent-purple)]/10 via-[var(--surface)] to-[var(--accent-purple)]/10 border-b border-[var(--border)] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-6xl select-none"
              style={{
                left: `${(i * 7) % 100}%`,
                top: `${(i * 13) % 100}%`,
                opacity: 0.3,
              }}
            >
              🎨
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-6 py-14 relative z-10 text-center">
          <div className="inline-flex justify-center items-center gap-2 bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/20 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <Flame size={14} /> {t('events.hero.badge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            {t('events.hero.title1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-purple)] to-[var(--warning)]">
              {t('events.hero.title2')}
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-xl max-w-2xl mx-auto">
            {t('events.hero.desc')}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
          {/* Type filter */}
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={handleTypeChange}
              aria-label={t('events.filter.typeAria')}
              className="bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-semibold rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--primary)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">{t('events.filter.allTypes')}</option>
              {types.map((tv) => (
                <option key={tv} value={tv}>
                  {typeLabel(tv)}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-1">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                name="q"
                defaultValue={search}
                placeholder={t('events.filter.searchPlaceholder')}
                aria-label={t('events.filter.searchAria')}
                className="bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg pl-9 pr-3 py-2 w-56 focus:outline-none focus:border-[var(--primary)]/50 transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>
            <button
              type="submit"
              className="bg-[var(--primary)] text-[var(--text-inverse)] text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              {t('events.filter.searchButton')}
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--surface-sunken)] border border-[var(--border)] rounded-xl p-1 shadow-sm mb-8 max-w-sm">
          {(['active', 'voting', 'past'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => navigateTab(tab)}
              className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[var(--surface)] shadow-sm text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'active' ? `🔴 ${t('events.tabs.active')}` : tab === 'voting' ? `🗳️ ${t('events.tabs.voting')}` : `🏆 ${t('events.tabs.past')}`}
            </button>
          ))}
        </div>

        {/* ACTIVE / PAST TAB */}
        {(activeTab === 'active' || activeTab === 'past') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.length === 0 && (
              <div className="col-span-full text-center py-16 text-[var(--text-muted)]">
                <Trophy size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">
                  {activeTab === 'active'
                    ? t('events.empty.active')
                    : t('events.empty.past')}
                </p>
                <p className="text-sm mt-1">
                  {activeTab === 'active'
                    ? t('events.empty.activeHint')
                    : t('events.empty.pastHint')}
                </p>
              </div>
            )}
            {events.map((event, idx) => {
              const badge = eventStatusBadge(event.status);
              return <EventCard key={event.id} event={event} badge={badge} index={idx} />;
            })}

            {/* Submit Your Own */}
            {activeTab === 'active' && (
              <div className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl p-7 flex flex-col items-center justify-center text-center hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer group">
                <div className="bg-[var(--surface-sunken)] border border-[var(--border)] group-hover:border-[var(--accent-purple)] p-4 rounded-full mb-4 transition-colors">
                  <Palette
                    size={28}
                    className="text-[var(--text-muted)] group-hover:text-[var(--accent-purple)] transition-colors"
                  />
                </div><h2 className="font-bold text-lg mb-2 group-hover:text-[var(--accent-purple)] transition-colors">
  {t('events.submit.idea')}
</h2>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {t('events.submit.desc')}
                </p>
                <button
                  disabled
                  className="bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 font-bold text-sm px-5 py-2.5 rounded-xl opacity-60 cursor-not-allowed transition-all"
                  title={t('events.submit.button')}
                >
                  {t('events.submit.button')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VOTING TAB */}
        {activeTab === 'voting' && (
          <div>
            {voteError && (
              <div className="bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] rounded-xl p-3 mb-4 text-sm font-medium flex items-center gap-2">
                <AlertTriangle size={16} /> {voteError}
              </div>
            )}
            {localVoting ? (
              <>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{t('events.voting.title', { title: localVoting.event.title })}</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                      {t('events.voting.closesIn')}{' '}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {(() => {
                          const end = new Date(localVoting.event.endDate);
                          const now = new Date();
                          const diff = end.getTime() - now.getTime();
                          if (diff <= 0) return t('events.voting.finished');
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          if (days > 0) return t('events.voting.days', { count: days });
                          return t('events.voting.hours', { count: hours });
                        })()}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-semibold">
                    <Star className="text-[var(--warning)] fill-current" />{' '}
                    <span>{t('events.voting.votePrompt')}</span>
                  </div>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {localVoting.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="break-inside-avoid bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="relative overflow-hidden min-h-[200px]">
                        <OptimizedImage
                          src={sub.imageUrl}
                          alt={`${t('events.voting.voteButton')} ${sub.user.username}`}
                          fill
                          className="group-hover:scale-[1.02] transition-transform duration-300"
                          objectFit="cover"
                        />
                        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-[var(--text-inverse)] text-xs font-bold px-2.5 py-1 rounded-lg">
                          @{sub.user.username}
                        </div>
                      </div>
                      <div className="p-4">
                        {sub.prompt && (
                          <p className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg p-2 mb-4 line-clamp-2">
                            {sub.prompt}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-black text-lg">
                            <ThumbsUp className="text-[var(--info)]" size={20} />{' '}
                            {sub.votes}
                          </span>
                          <button
                            disabled={userId === null || (votedId !== null && votedId !== sub.id) || votingLoading}
                            onClick={() => handleVote(sub.id, localVoting.event.id)}
                            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                              votedId === sub.id
                                ? 'bg-[var(--success)] text-[var(--text-inverse)] cursor-default'
                                : userId === null || (votedId !== null && votedId !== sub.id)
                                  ? 'bg-[var(--surface-sunken)] text-[var(--text-muted)] cursor-not-allowed'
                                  : 'bg-[var(--primary)] text-[var(--text-inverse)] hover:opacity-90'
                            }`}
                          >
                            {votedId === sub.id ? `✓ ${t('events.voting.votedButton')}` : t('events.voting.voteButton')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-[var(--text-muted)]">
                <Star size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">{t('events.voting.noActiveTitle')}</p>
                <p className="text-sm mt-1">
                  {t('events.voting.noActiveHint')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && activeTab !== 'voting' && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => navigatePage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
              {t('events.pagination.previous')}
            </button>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => navigatePage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {t('events.pagination.next')}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
