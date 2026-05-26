'use client';

import { Shield, Target, Award, AlertTriangle, BookOpen, BarChart, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { DateRangePicker, type DateRangePreset, type DateRange } from '@/components/Analytics/DateRangePicker';
import { ExportAnalyticsButton } from '@/components/Analytics/ExportAnalyticsButton';
import { MangaSelector, type MangaOption } from '@/components/Analytics/MangaSelector';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useT } from '@/i18n';

interface CreatorData {
  views: number;
  reads: number;
  completions: number;
  completionRate: number;
  avgTimeSpent: number;
  avgScrollDepth?: number;
  popularChapters: Array<{
    chapterId: string;
    chapterNumber: number;
    title: string;
    views: number;
    reads?: number;
    completionRate?: number;
    mangaTitle: string;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    reads: number;
  }>;
}

interface ReaderData {
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    level: number;
    xpPoints: number;
    auraBalance: number;
  };
  stats: {
    totalChaptersRead: number;
    totalMangaInLibrary: number;
    totalAchievements: number;
    nextLevelXp: number;
  };
  achievements: Array<{
    id: string;
    unlockedAt: string;
    name: string;
    description: string;
    icon: string | null;
  }>;
  clan: {
    name: string;
    totalScore: number;
    monthlyScore: number;
    role: string;
    contributedScore: number;
    rank: number;
  } | null;
}

function getDefaultDateRange(): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const t = useT();

  const [activeTab, setActiveTab] = useState<'creator' | 'reader'>('creator');

  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [readerData, setReaderData] = useState<ReaderData | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const [selectedMangaId, setSelectedMangaId] = useState<string | null>(null);
  const [creatorMangas, setCreatorMangas] = useState<MangaOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCreatorData = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedMangaId) params.append('mangaId', selectedMangaId);
    params.append('from', dateRange.from.toISOString());
    params.append('to', dateRange.to.toISOString());
    const res = await fetch(`/api/analytics/dashboard?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch creator analytics');
    return res.json();
  }, [selectedMangaId, dateRange]);

  const fetchCreatorMangas = useCallback(async () => {
    const res = await fetch('/api/creator/mangas');
    if (!res.ok) return [];
    const data = await res.json();
    return data.mangas || data || [];
  }, []);

  const fetchReaderData = useCallback(async () => {
    const res = await fetch('/api/me');
    if (!res.ok) throw new Error('Failed to fetch reader data');
    return res.json();
  }, []);

  // Data fetching
  const shouldFetch = session?.user?.id;

  useEffect(() => {
    if (!shouldFetch) return;
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchCreatorMangas().then((m) => { if (!cancelled) setCreatorMangas(m); }).catch(() => { if (!cancelled) setError(t('analytics.errorLoadingMangas')); }),
      fetchCreatorData().then((d) => { if (!cancelled) setCreatorData(d); }).catch(() => { /* error handled by AnalyticsDashboard */ }),
      fetchReaderData().then((d) => { if (!cancelled) setReaderData(d); }).catch(() => { /* not critical */ }),
    ]).finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [shouldFetch, fetchCreatorMangas, fetchCreatorData, fetchReaderData, t]);

  const xpForNextLevel = readerData?.stats.nextLevelXp || 2000;
  const currentXp = readerData?.user.xpPoints || 0;
  const prevLevelXp = xpForNextLevel - 500;
  const levelProgress = Math.min(((currentXp - prevLevelXp) / (xpForNextLevel - prevLevelXp)) * 100, 100);

  const analyticsDataForComponent = useMemo(() => {
    if (!creatorData) return undefined;
    const apiReads = creatorData.reads || 0;
    const apiCompletions = creatorData.completions || 0;
    return {
      views: creatorData.views,
      reads: apiReads,
      completions: apiCompletions,
      avgTimeSpent: creatorData.avgTimeSpent,
      avgScrollDepth: creatorData.avgScrollDepth ?? 0,
      popularChapters: creatorData.popularChapters.map(ch => ({
        chapterId: ch.chapterId,
        chapterNumber: ch.chapterNumber,
        views: ch.views,
        title: ch.title,
        reads: ch.reads ?? Math.round(ch.views * (apiReads && creatorData.views ? apiReads / creatorData.views : 0.6)),
        completionRate: ch.completionRate ?? (apiReads > 0 ? Math.round((apiCompletions / apiReads) * 100) : 0),
      })),
      dailyStats: creatorData.dailyStats,
    };
  }, [creatorData]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">

        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2 border-b border-custom pb-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <BarChart size={28} className="text-accent-blue" aria-hidden="true" />
            <h1 className="text-3xl font-extrabold tracking-tight">{t('analytics.title')}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div role="tablist" aria-label="Tipo de analíticas" className="flex bg-tertiary rounded-lg p-1">
              <button
                role="tab"
                aria-selected={activeTab === 'creator'}
                aria-controls="analytics-creator-panel"
                tabIndex={activeTab === 'creator' ? 0 : -1}
                onClick={() => setActiveTab('creator')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'creator' ? 'bg-secondary shadow-sm text-accent-blue' : 'text-muted hover:text-fg-primary'}`}
              >
                {t('analytics.creatorStudio')}
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'reader'}
                aria-controls="analytics-reader-panel"
                tabIndex={activeTab === 'reader' ? 0 : -1}
                onClick={() => setActiveTab('reader')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'reader' ? 'bg-secondary shadow-sm text-accent-orange' : 'text-muted hover:text-fg-primary'}`}
              >
                {t('analytics.readerProfile')}
              </button>
            </div>
            <ExportAnalyticsButton activeTab={activeTab} />
          </div>
        </header>



        {error && (
          <div className="card p-8 rounded-xl text-center" role="alert">
            <AlertTriangle size={32} className="text-accent-red mx-auto mb-3" aria-hidden="true" />
            <p className="text-muted mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-accent-blue text-[var(--text-inverse)] rounded-lg hover:opacity-90 transition-opacity font-bold text-sm">
              {t('analytics.retry')}
            </button>
          </div>
        )}

        {!isLoading && !session?.user?.id && (
          <div className="card p-16 rounded-xl text-center">
            <BarChart size={40} className="text-muted mx-auto mb-4" />
            <p className="text-muted text-lg">{t('analytics.loginToView')}</p>
          </div>
        )}

        {activeTab === 'creator' && session?.user?.id && !error && (
          <div id="analytics-creator-panel" role="tabpanel" aria-labelledby="analytics-creator-tab" className="space-y-6 animate-fade-in-up">
            {creatorMangas.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <MangaSelector
                  mangas={creatorMangas}
                  selectedId={selectedMangaId}
                  onSelect={setSelectedMangaId}
                  allText={t('analytics.allManga')}
                  placeholder={t('analytics.selectManga')}
                  className="sm:w-72"
                />
                <DateRangePicker
                  value={dateRange}
                  preset={datePreset}
                  onChange={(range, preset) => {
                    setDateRange(range);
                    setDatePreset(preset);
                  }}
                />
              </div>
            )}

            <AnalyticsDashboard
              mangaId={selectedMangaId}
              dateRange={dateRange}
              customData={analyticsDataForComponent}
            />
          </div>
        )}

        {activeTab === 'reader' && session?.user?.id && !error && (
          <div id="analytics-reader-panel" role="tabpanel" aria-labelledby="analytics-reader-tab" className="space-y-6 animate-fade-in-up">
            {readerData ? (
              <>
                <div className="bg-gradient-to-r from-secondary to-tertiary p-8 rounded-2xl shadow-sm border border-custom flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-full border-4 border-accent-orange shadow-lg flex items-center justify-center bg-secondary relative overflow-hidden flex-shrink-0">
                    {readerData.user.avatarUrl ? (
                      <OptimizedImage src={readerData.user.avatarUrl} alt="Avatar" fill className="w-full h-full" />
                    ) : (
                      <OptimizedImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(readerData.user.displayName || readerData.user.username)}&size=128&background=random`} alt="Avatar" fill className="w-full h-full" />
                    )}
                    <div className="absolute bottom-0 w-full bg-black/60 text-[var(--text-inverse)] text-center text-xs font-bold py-1">{t('analytics.level')} {readerData.user.level}</div>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <h2 className="text-3xl font-bold flex items-center gap-2">
                        {readerData.user.displayName || readerData.user.username}
                        <Shield size={24} className="text-accent-purple" aria-hidden="true" />
                      </h2>
                      <p className="text-muted">
                        {readerData.clan ? `${t('analytics.memberOf')}: ${readerData.clan.name}` : t('analytics.noClanLabel')}
                        {' \u2022 '}Aura: {readerData.user.auraBalance.toLocaleString('es')}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Nivel {readerData.user.level}</span>
                        <span>{currentXp.toLocaleString('es')} / {xpForNextLevel.toLocaleString('es')} XP</span>
                      </div>
                      <div className="w-full bg-secondary h-3 rounded-full border border-custom overflow-hidden" role="progressbar" aria-valuenow={Math.round(levelProgress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso de nivel: ${Math.round(levelProgress)}%`}>
                        <div className="bg-gradient-to-r from-accent-orange to-accent-red h-full transition-all" style={{ width: `${levelProgress}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <BookOpen size={20} className="text-accent-blue mx-auto mb-1" aria-hidden="true" />
                        <p className="text-lg font-bold">{readerData.stats.totalChaptersRead.toLocaleString('es')}</p>
                        <p className="text-xs text-muted">{t('analytics.chapters')}</p>
                      </div>
                      <div className="text-center">
                        <TrendingUp size={20} className="text-accent-green mx-auto mb-1" aria-hidden="true" />
                        <p className="text-lg font-bold">{readerData.stats.totalMangaInLibrary.toLocaleString('es')}</p>
                        <p className="text-xs text-muted">{t('analytics.inLibrary')}</p>
                      </div>
                      <div className="text-center">
                        <Award size={20} className="text-accent-orange mx-auto mb-1" aria-hidden="true" />
                        <p className="text-lg font-bold">{readerData.stats.totalAchievements.toLocaleString('es')}</p>
                        <p className="text-xs text-muted">{t('analytics.achievements')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="card p-6 rounded-xl">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Award size={20} className="text-accent-orange" aria-hidden="true" /> {t('analytics.unlockedAchievements')} ({readerData.stats.totalAchievements})</h3>
                    {readerData.achievements.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {readerData.achievements.slice(0, 6).map((badge) => (
                          <div key={badge.id} className="flex flex-col items-center text-center p-3 bg-tertiary rounded-lg border border-custom hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-12 h-12 rounded-full mb-2 flex items-center justify-center font-bold text-xl bg-accent-orange/20 text-accent-orange">
                              {badge.icon || '\u2605'}
                            </div>
                            <span className="text-xs font-bold">{badge.name}</span>
                            <span className="text-[10px] text-muted">{badge.description}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-sm">{t('analytics.noAchievements')}</p>
                    )}
                  </div>

                  <div className="card p-6 rounded-xl border-t-4 border-t-accent-purple" role="region" aria-label="Información del clan">
                    {readerData.clan ? (
                      <>
                        <h3 className="font-bold text-lg mb-4">{t('analytics.memberOf')}: {readerData.clan.name}</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-tertiary rounded-lg">
                            <span className="font-semibold text-sm">{t('analytics.globalPosition')}</span>
                            <span className="text-xl font-black text-accent-purple">#{readerData.clan.rank}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-tertiary rounded-lg">
                            <span className="font-semibold text-sm">{t('analytics.monthlyContribution')}</span>
                            <span className="font-bold">{readerData.clan.contributedScore.toLocaleString('es')} XP</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-tertiary rounded-lg">
                            <span className="font-semibold text-sm">{t('analytics.clanTotalScore')}</span>
                            <span className="font-bold">{readerData.clan.totalScore.toLocaleString('es')} XP</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Users size={48} className="text-muted mx-auto mb-4" aria-hidden="true" />
                        <h3 className="font-bold text-lg mb-1">{t('analytics.noClan')}</h3>
                        <p className="text-muted text-sm mb-4">{t('analytics.joinClan')}</p>
                        <Link href="/community" className="px-4 py-2 bg-accent-purple text-[var(--text-inverse)] rounded-lg inline-block font-bold text-sm hover:bg-accent-purple/80 transition-colors">
                          {t('analytics.exploreClans')}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="card p-16 rounded-xl text-center">
                <Target size={40} className="text-muted mx-auto mb-4" />
                <p className="text-muted">{t('analytics.profileLoadError')}</p>
              </div>
            )}
          </div>
        )}

    </div>
  );
}