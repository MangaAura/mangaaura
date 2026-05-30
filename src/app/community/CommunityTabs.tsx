'use client';

import {
  Trophy,
  Calendar,
  Users,
  Flame,
  ArrowRight,
  ChevronRight,
  Plus,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import ClanCard from '@/components/Clan/ClanCard';
import { EventCard, eventStatusBadge } from '@/components/Event/EventCard';
import type { EventData } from '@/components/Event/EventCard';
import { PollsSection } from '@/components/polls/PollsSection';
import { useT } from '@/i18n';

interface ClanData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emblemUrl: string | null;
  totalScore: number;
  monthlyScore: number;
  memberCount: number;
}

interface CommunityTabsProps {
  topClans: ClanData[];
  activeEvents: EventData[];
  totalClans: number;
  userClanSlug: string | null;
}

type Tab = 'clans' | 'events' | 'polls';

export default function CommunityTabs({
  topClans,
  activeEvents,
  totalClans,
  userClanSlug,
}: CommunityTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('clans');
  const t = useT();

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Tab;
    if (hash === 'clans' || hash === 'events' || hash === 'polls') {
      queueMicrotask(() => setActiveTab(prev => prev === hash ? prev : hash));
    }
    const onPopState = () => {
      const newHash = window.location.hash.replace('#', '') as Tab;
      if (newHash === 'clans' || newHash === 'events' || newHash === 'polls') {
        setActiveTab(prev => prev === newHash ? prev : newHash);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    history.replaceState(null, '', `#${tab}`);
  };

  const tabCls = (tab: Tab, activeColor: string) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
      activeTab === tab
        ? `bg-[var(--surface)] shadow-sm ${activeColor}`
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
    }`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-6 pt-20 pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Users className="text-[var(--primary)]" size={30} aria-hidden="true" />
            {t('community.title')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {t('community.subtitle')}
          </p>
        </div>

        <div className="flex bg-[var(--surface-elevated)] rounded-xl p-1 border border-[var(--border)] shadow-sm">
          <div role="tablist" aria-label="Secciones de la comunidad" className="flex">
            <button role="tab" aria-selected={activeTab === 'clans'} aria-controls="community-clans-panel" tabIndex={activeTab === 'clans' ? 0 : -1} onClick={() => handleTabChange('clans')} className={tabCls('clans', 'text-[var(--accent-purple)]')}>
              <Trophy size={16} aria-hidden="true" /> {t('community.clansTab')}
            </button>
            <button role="tab" aria-selected={activeTab === 'events'} aria-controls="community-events-panel" tabIndex={activeTab === 'events' ? 0 : -1} onClick={() => handleTabChange('events')} className={tabCls('events', 'text-[var(--warning)]')}>
              <Calendar size={16} aria-hidden="true" /> {t('community.eventsTab')}
            </button>
            <button role="tab" aria-selected={activeTab === 'polls'} aria-controls="community-polls-panel" tabIndex={activeTab === 'polls' ? 0 : -1} onClick={() => handleTabChange('polls')} className={tabCls('polls', 'text-[var(--primary)]')}>
              <BarChart3 size={16} aria-hidden="true" /> Encuestas
            </button>
          </div>
          <Link href="/community/rules" className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]">
            <Users size={16} aria-hidden="true" /> {t('community.rulesTab')}
          </Link>
        </div>
      </header>

      {/* CLANS TAB */}
      {activeTab === 'clans' && (
        <div id="community-clans-panel" role="tabpanel" aria-labelledby="community-clans-tab" className="space-y-6 animate-fade-up">
          {/* Banner */}
          <div className="bg-gradient-to-r from-[var(--accent-purple)]/10 to-[var(--primary)]/10 rounded-2xl border border-[var(--accent-purple)]/20 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--accent-purple)] flex items-center gap-2 mb-1">
                  <Flame size={22} className="text-[var(--warning)]" aria-hidden="true" />
                  {t('community.clanWars')}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('community.clanWarsDesc')}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {userClanSlug && (
                  <Link
                    href={`/community/clan/${userClanSlug}`}
                    className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/50 text-[var(--text-primary)] px-4 py-2 rounded-xl font-semibold transition-all text-sm flex items-center gap-2"
                  >
                    <Trophy size={16} className="text-[var(--warning)]" aria-hidden="true" />
                    {t('community.myClan')}
                  </Link>
                )}
                {!userClanSlug && (
                  <Link
                    href="/community/clans/create"
                    className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/50 text-[var(--primary)] px-4 py-2 rounded-xl font-semibold transition-all text-sm flex items-center gap-2"
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t('community.createClan')}
                  </Link>
                )}
                <Link
                  href="/community/clans"
                  className="bg-[var(--accent-purple)] hover:bg-[var(--accent-purple-hover)] text-[var(--text-inverse)] px-4 py-2 rounded-xl font-semibold transition-all text-sm flex items-center gap-2"
                >
                  {t('community.viewAllClans', { count: totalClans })}
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Top Clans Grid */}
          {topClans.length === 0 ? (
            <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <Trophy className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">{t('community.noClansYet')}</p>
              <Link
                href="/community/clans/create"
                className="mt-4 inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] px-5 py-2.5 rounded-xl font-semibold transition-all text-sm"
              >
                {t('community.createClan')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topClans.map((clan, idx) => (
                <ClanCard
                  key={clan.id}
                  clan={clan}
                  index={idx}
                  rank={idx + 1}
                />
              ))}
            </div>
          )}

          <div className="text-center">
            <Link
              href="/community/clans"
              className="text-[var(--primary)] hover:underline font-semibold text-sm inline-flex items-center gap-1"
            >
              {t('community.viewAllClansLink')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* POLLS TAB */}
      {activeTab === 'polls' && (
        <div id="community-polls-panel" role="tabpanel" aria-labelledby="community-polls-tab" className="animate-fade-up">
          <PollsSection limit={5} showCreateForm={true} title="Encuestas de la comunidad" />
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div id="community-events-panel" role="tabpanel" aria-labelledby="community-events-tab" className="space-y-6 animate-fade-up">
          {activeEvents.length === 0 ? (
            <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              <Calendar className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">
                {t('community.noActiveEvents')}
              </p>
              <Link
                href="/events"
                className="text-[var(--warning)] hover:underline text-sm font-semibold mt-2 inline-block"
              >
                {t('community.viewAllEventsLink')}
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-[var(--warning)]/10 to-transparent p-6 rounded-2xl border border-[var(--warning)]/20">
                <h2 className="text-xl font-bold text-[var(--warning)] mb-1 flex items-center gap-2">
                  <Flame size={20} aria-hidden="true" />
                  {t('community.communityEvents')}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('community.eventPrizes')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeEvents.map((event, idx) => {
                  const badge = eventStatusBadge(event.status);
                  return (
                    <EventCard key={event.id} event={event} badge={badge} index={idx} />
                  );
                })}
              </div>
              <div className="text-center">
                <Link
                  href="/events"
                  className="text-[var(--warning)] hover:underline font-semibold text-sm inline-flex items-center gap-1"
                >
                  {t('community.viewAllEventsLink')} <ArrowRight size={14} />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

          </div>
  );
}


