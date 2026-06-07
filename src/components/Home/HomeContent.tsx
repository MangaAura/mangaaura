'use client';

import { Trophy, Clock, TrendingUp, Sparkles, BookOpen, Wand2, WifiOff, Gamepad2, Coins, HelpCircle, ArrowRight, Rocket, Flame } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Suspense, lazy } from 'react';

import { GenreMarquee } from '@/components/GenreMarquee';
import { AnimatedHero } from '@/components/Home/AnimatedHero';
import { MangaCard } from '@/components/MangaCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

// Dynamic imports for below-the-fold components to reduce unused JS on initial load
const ContinueReadingSection = lazy(() => import('@/components/Home/ContinueReadingSection').then(m => ({ default: m.ContinueReadingSection })));
const HomeNewsSection = lazy(() => import('@/components/Home/HomeNewsSection').then(m => ({ default: m.HomeNewsSection })));
const HomeRankingsSidebar = lazy(() => import('@/components/Home/HomeRankingsSidebar').then(m => ({ default: m.HomeRankingsSidebar })));
const QuestPanelWrapper = lazy(() => import('@/components/Home/QuestPanelWrapper').then(m => ({ default: m.QuestPanelWrapper })));

interface MangaData {
  id: string;
  title: string;
  slug?: string;
  coverUrl?: string | null;
  status?: string;
  tags?: string[];
  authorName?: string | null;
  authorUsername?: string;
  rating?: number;
  chapterCount?: number;
  totalViews?: number;
}

interface UserData {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  xpPoints: number;
}

interface FeaturedManga {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  description: string | null;
  authorName: string | null;
}

interface HomeContentProps {
  latestMangas: MangaData[];
  topMangas: MangaData[];
  updatingMangas: MangaData[];
  trendingMangas?: MangaData[];
  newsArticles?: Record<string, unknown>[];
  topUsers: UserData[];
  featuredManga: FeaturedManga | null;
  totalMangas: number;
  totalReaders: number;
  totalChapters: number;
}

export function HomeContent({
  latestMangas,
  topMangas,
  updatingMangas,
  trendingMangas,
  newsArticles,
  topUsers,
  featuredManga,
  totalMangas,
  totalReaders,
  totalChapters,
}: HomeContentProps) {
  const t = useT();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const ctaHref = !isLoggedIn ? '/auth/register' : '/creator/manga/new';
  const ctaLabel = !isLoggedIn ? t('nav.register') : t('creator.newManga');

  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary">
      <AnimatedHero
        title={featuredManga?.title ?? 'MangaAura'}
        description={featuredManga?.description ?? t('home.description')}
        coverUrl={featuredManga?.coverUrl ?? null}
        mangaSlug={featuredManga?.slug ?? ''}
        totalMangas={totalMangas}
        totalReaders={totalReaders}
        totalChapters={totalChapters}
      />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <GenreMarquee />

        {/* Trending This Week — redesigned with premium aesthetic */}
        {trendingMangas && trendingMangas.length > 0 && (
          <AnimatedContainer viewport>
            <section className="relative overflow-hidden rounded-2xl border border-[var(--error)]/10 bg-gradient-to-br from-[var(--surface-elevated)] via-[var(--surface)] to-[var(--surface-sunken)] p-6 md:p-8 shadow-xl">
              {/* Ambient glow — warm ember feel */}
              <div className="absolute -top-20 right-0 w-72 h-72 bg-[var(--error)]/8 rounded-full blur-[120px]" />
              <div className="absolute -bottom-20 left-0 w-56 h-56 bg-[var(--warning)]/8 rounded-full blur-[100px]" />
              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, var(--warning) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }} />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="relative">
                        <Flame className="w-8 h-8 text-[var(--error)] drop-shadow-[0_0_8px_var(--error)]" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--error)] rounded-full animate-ping opacity-70" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                        <span className="bg-gradient-to-r from-[var(--error)] via-[var(--warning)] to-amber-400 bg-clip-text text-transparent">
                          {t('home.trendingTitle')}
                        </span>
                      </h2>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)] ml-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--error)] animate-pulse" />
                      {t('home.trendingSubtitle')}
                    </p>
                  </div>
                  <Link href="/explore?sort=trending" aria-label={t('common.viewAll') + ' trending'}>
                    <Button variant="ghost" size="sm" className="text-xs gap-1.5 group">
                      {t('common.viewAll')}
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {trendingMangas.slice(0, 8).map((manga, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    return (
                      <div key={manga.id} className="relative group/card">
                        {/* Rank badge — integrated, no overlap issues */}
                        <div className={cn(
                          "absolute -top-2.5 -left-2.5 z-20 w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-xs font-bold border-2 transition-transform duration-300 group-hover/card:scale-110",
                          rank === 1 && "bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 text-white border-yellow-200/40 shadow-yellow-500/20",
                          rank === 2 && "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border-slate-300/40",
                          rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-800 text-white border-amber-500/30",
                          rank >= 4 && "bg-gradient-to-br from-[var(--surface-sunken)] to-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border)]",
                        )}>
                          {rank === 1 ? (
                            <Flame className="w-4 h-4 drop-shadow-sm" />
                          ) : (
                            <span>#{rank}</span>
                          )}
                        </div>

                        {/* Trend badge */}
                        <div className={cn(
                          "absolute -top-2.5 -right-2.5 z-20 flex items-center gap-1 rounded-full shadow-lg text-[10px] font-bold px-2 py-0.5",
                          rank === 1 && "bg-gradient-to-r from-[var(--error)] to-[var(--warning)] text-white animate-pulse",
                          rank === 2 && "bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border)]",
                          rank === 3 && "bg-[var(--surface-sunken)] text-[var(--text-secondary)] border border-[var(--border)]",
                          rank >= 4 && "bg-[var(--surface-sunken)] text-[var(--text-tertiary)] border border-[var(--border)] opacity-0 group-hover/card:opacity-100 transition-opacity",
                        )}>
                          {rank <= 3 && (
                            <Flame className={cn(
                              "w-2.5 h-2.5",
                              rank === 1 ? "text-white" : "text-[var(--warning)]",
                            )} />
                          )}
                          <span>{rank === 1 ? t('home.trendingHot') : `#${rank}`}</span>
                        </div>

                        {/* Card wrapper with rank-based border glow */}
                        <div className={cn(
                          "relative rounded-xl transition-all duration-300",
                          rank === 1 && "ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/5 group-hover/card:shadow-amber-500/15 group-hover/card:ring-amber-500/30",
                          rank === 2 && "group-hover/card:shadow-md group-hover/card:shadow-slate-500/5",
                          rank === 3 && "group-hover/card:shadow-md group-hover/card:shadow-amber-600/5",
                          isTop3 && "overflow-hidden",
                        )}>
                          <AnimatedContainer animation="fadeInUp" delay={index * 0.05}>
                            <MangaCard manga={manga} />
                          </AnimatedContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </AnimatedContainer>
        )}

        <AnimatedContainer viewport>
          <section className="text-center py-8">
            <h2 className="text-3xl font-bold mb-2">{t('home.howItWorksTitle')}</h2>
            <p className="text-muted mb-10">{t('home.howItWorksDesc')}</p>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { icon: BookOpen, title: t('home.step1Title'), desc: t('home.step1Desc'), color: 'from-primary to-accent-blue' },
                { icon: Wand2, title: t('home.step2Title'), desc: t('home.step2Desc'), color: 'from-accent-purple to-primary' },
                { icon: Coins, title: t('home.step3Title'), desc: t('home.step3Desc'), color: 'from-secondary to-accent-green' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedContainer>

        <AnimatedContainer viewport>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[var(--warning)]" /> {t('home.topMangas')}
            </h2>
            <Link href="/rankings" aria-label={t('common.viewAll') + ' rankings'}>
              <Button variant="ghost">{t('common.viewAll')} →</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topMangas.map((manga, index) => (
              <AnimatedContainer key={manga.id} animation="fadeInUp" delay={index * 0.08}>
                <MangaCard manga={manga} />
              </AnimatedContainer>
            ))}
          </div>
        </AnimatedContainer>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <AnimatedContainer viewport>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="w-6 h-6 text-[var(--primary)]" /> {t('home.latestUpdates')}
                  </h2>
                  <Link href="/explore" aria-label={t('common.viewAll') + ' explorar'}>
                    <Button variant="ghost">{t('common.viewAll')} →</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {updatingMangas.map((manga) => (
                    <MangaCard key={manga.id} manga={manga} />
                  ))}
                </div>
              </section>
            </AnimatedContainer>

            <Suspense fallback={<div className="h-48 animate-pulse bg-[var(--surface-sunken)] rounded-xl" />}>
              <AnimatedContainer viewport>
                <HomeNewsSection articles={newsArticles} />
              </AnimatedContainer>
            </Suspense>
          </div>

          <div className="space-y-6">
            <Suspense fallback={<div className="h-32 animate-pulse bg-[var(--surface-sunken)] rounded-xl" />}>
              <ContinueReadingSection />
            </Suspense>

            <Suspense fallback={<div className="h-24 animate-pulse bg-[var(--surface-sunken)] rounded-xl" />}>
              <QuestPanelWrapper />
            </Suspense>

            <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--surface-sunken)] rounded-xl" />}>
              <AnimatedContainer viewport>
                <HomeRankingsSidebar topMangas={topMangas} />
              </AnimatedContainer>
            </Suspense>

            <AnimatedContainer viewport>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-accent-green" /> {t('home.topReaders')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topUsers.map((user, index) => (
                      <Link
                        key={user.id}
                        href={'/user/' + user.username}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-tertiary transition-colors"
                      >
                        <span className="text-lg font-bold text-muted w-6">#{index + 1}</span>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.username}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white font-bold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.username}</p>
                          <p className="text-xs text-muted">{t('home.levelAndXp', { level: user.level, xp: user.xpPoints })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/rankings">
                    <Button variant="outline" className="w-full mt-4">{t('home.viewFullRankings')}</Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedContainer>

            <AnimatedContainer viewport>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent-blue" /> {t('home.newReleases')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {latestMangas.slice(0, 3).map((manga) => (
                    <Link
                      key={manga.id}
                      href={`/manga/${manga.slug}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-12 h-16 bg-tertiary rounded overflow-hidden flex-shrink-0 relative">
                        {manga.coverUrl ? (
                          <Image src={manga.coverUrl} alt={manga.title} width={48} height={64} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-accent-purple" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-accent-blue transition-colors">
                          {manga.title}
                        </p>
                        <p className="text-xs text-muted">{manga.authorName}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
                <CardFooter>
                  <Link href="/discover" className="w-full">
                    <Button variant="outline" className="w-full">{t('home.viewAllNewReleases')}</Button>
                  </Link>
                </CardFooter>
              </Card>
            </AnimatedContainer>
          </div>
        </div>

        <AnimatedContainer viewport>
          <section className="py-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">{t('home.featuresTitle')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Wand2, title: t('home.featureAI'), desc: t('home.featureAIDesc'), color: 'from-primary to-accent-blue' },
                { icon: WifiOff, title: t('home.featurePWA'), desc: t('home.featurePWADesc'), color: 'from-accent-purple to-primary' },
                { icon: Gamepad2, title: t('home.featureGamification'), desc: t('home.featureGamificationDesc'), color: 'from-secondary to-accent-green' },
                { icon: Rocket, title: t('home.featureCrowdfunding'), desc: t('home.featureCrowdfundingDesc'), color: 'from-accent-blue to-accent-purple' },
              ].map((feat, i) => (
                <div key={i} className="p-6 rounded-2xl border border-border hover:border-primary/30 transition-all group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">{feat.title}</h3>
                  <p className="text-sm text-muted">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </AnimatedContainer>

        <AnimatedContainer viewport>
          <section className="py-8">
            <h2 className="text-3xl font-bold mb-2 text-center">{t('home.visibleFaqTitle')}</h2>
            <div className="max-w-3xl mx-auto mt-8 space-y-4">
              {[
                { q: t('home.visibleFaq1Q'), a: t('home.visibleFaq1A') },
                { q: t('home.visibleFaq2Q'), a: t('home.visibleFaq2A') },
                { q: t('home.visibleFaq3Q'), a: t('home.visibleFaq3A') },
                { q: t('home.visibleFaq4Q'), a: t('home.visibleFaq4A') },
              ].map((faq, i) => (
                <details key={i} className="group border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-tertiary/50 transition-colors font-medium">
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="p-4 pt-0 text-sm text-muted border-t border-border mt-2">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </AnimatedContainer>

        <AnimatedContainer viewport>
          <section className="bg-gradient-to-r from-accent-purple/20 via-accent-purple/10 to-accent-blue/20 border border-accent-purple/30 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('home.ctaCreatorTitle')}</h2>
                <p className="text-muted">{t('home.ctaCreatorDesc')}</p>
              </div>
              <Link
                href={ctaHref}
                aria-label={!isLoggedIn ? t('home.ctaCreatorRegister') : t('creator.newManga')}
                className="inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-medium transition-all hover:opacity-90 text-white"
                style={{ background: 'linear-gradient(to right, var(--accent-purple), var(--primary))' }}
              >
                <Sparkles className="w-4 h-4" /> {ctaLabel}
              </Link>
            </div>
          </section>
        </AnimatedContainer>
      </div>
    </div>
  );
}
