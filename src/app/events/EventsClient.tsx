'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventCard, eventStatusBadge } from '@/components/Event/EventCard';
import type { EventData } from '@/components/Event/EventCard';
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
  highlight,
  types,
}: EventsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab when initialTab prop changes (e.g. browser back/forward)
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
        // Update vote count locally
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
      setVoteError('Error al registrar tu voto. Inténtalo de nuevo.');
    } finally {
      setVotingLoading(false);
    }
  };

  // Type label helper
  const typeLabel = (t: string) => {
    switch (t) {
      case 'ART_CHALLENGE': return '🎨 Desafío de Arte';
      case 'SPEEDREADING': return '⚡ Lectura Rápida';
      case 'COMMUNITY': return '👥 Comunidad';
      default: return t;
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
            <Flame size={14} /> EVENTOS DE LA COMUNIDAD
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Desafíos de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-purple)] to-[var(--warning)]">
              Arte IA
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-xl max-w-2xl mx-auto">
            La plataforma da el prompt base. Tú generas el arte. La comunidad vota. El mejor gana InkCoins y reconocimiento eterno.
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
              className="bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-semibold rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--primary)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors"
            >
              <option value="">Todos los tipos</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
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
                placeholder="Buscar eventos..."
                className="bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg pl-9 pr-3 py-2 w-56 focus:outline-none focus:border-[var(--primary)]/50 transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>
            <button
              type="submit"
              className="bg-[var(--primary)] text-[var(--text-inverse)] text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              Buscar
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
              {tab === 'active' ? '🔴 Activos' : tab === 'voting' ? '🗳️ Votación' : '🏆 Pasados'}
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
                    ? 'No hay eventos activos ahora'
                    : 'No hay eventos pasados'}
                </p>
                <p className="text-sm mt-1">
                  {activeTab === 'active'
                    ? 'Vuelve pronto para nuevos desafíos'
                    : 'Los eventos completados aparecerán aquí'}
                </p>
              </div>
            )}
            {events.map((event, idx) => {
              const badge = eventStatusBadge(event.status);
              return <EventCard key={event.id} event={event} badge={badge} index={idx} />;
            })}

            {/* Submit Your Own (only on active tab) */}
            {activeTab === 'active' && (
              <div className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl p-7 flex flex-col items-center justify-center text-center hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer group">
                <div className="bg-[var(--surface-sunken)] border border-[var(--border)] group-hover:border-[var(--accent-purple)] p-4 rounded-full mb-4 transition-colors">
                  <Palette
                    size={28}
                    className="text-[var(--text-muted)] group-hover:text-[var(--accent-purple)] transition-colors"
                  />
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-[var(--accent-purple)] transition-colors">
                  ¿Tienes una idea para un evento?
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Propón un desafío y si la comunidad vota a favor, lo lanzaremos con recompensas oficiales.
                </p>
                <button
                  disabled
                  className="bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 font-bold text-sm px-5 py-2.5 rounded-xl opacity-60 cursor-not-allowed transition-all"
                  title="Próximamente"
                >
                  Proponer Evento (próximamente)
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
                    <h2 className="font-bold text-lg">Votación: {localVoting.event.title}</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                      Cierra en:{' '}
                      <span className="font-bold text-[var(--warning)]">
                        {(() => {
                          const end = new Date(localVoting.event.endDate);
                          const now = new Date();
                          const diff = end.getTime() - now.getTime();
                          if (diff <= 0) return 'Finalizado';
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          if (days > 0) return `${days} día${days > 1 ? 's' : ''}`;
                          return `${hours}h`;
                        })()}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] font-semibold">
                    <Star className="text-[var(--warning)] fill-current" />{' '}
                    <span>Vota por tu favorita</span>
                  </div>
                </div>

                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {localVoting.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="break-inside-avoid bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="relative">
                        <img
                          src={sub.imageUrl}
                          alt={`Entrada de ${sub.user.username}`}
                          className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
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
                            {votedId === sub.id ? '✓ Votada' : 'Votar'}
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
                <p className="text-lg font-semibold">No hay votaciones activas</p>
                <p className="text-sm mt-1">
                  Las votaciones se abren cuando finaliza un evento de arte
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
              Anterior
            </button>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => navigatePage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
