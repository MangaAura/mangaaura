'use client';

import { Trophy, Clock, TrendingUp, Sparkles, BookOpen, Wand2, WifiOff, Gamepad2, Coins, HelpCircle, ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { GenreMarquee } from '@/components/GenreMarquee';
import { AnimatedHero } from '@/components/Home/AnimatedHero';
import { ContinueReadingSection } from '@/components/Home/ContinueReadingSection';
import { HomeNewsSection } from '@/components/Home/HomeNewsSection';
import { HomeRankingsSidebar } from '@/components/Home/HomeRankingsSidebar';
import { QuestPanelWrapper } from '@/components/Home/QuestPanelWrapper';
import { MangaCard } from '@/components/MangaCard';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';

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
            <Link href="/rankings">
              <Button variant="ghost" size="sm">{t('common.viewAll')} →</Button>
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
                  <Link href="/explore">
                    <Button variant="ghost" size="sm">{t('common.viewAll')} →</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {updatingMangas.map((manga) => (
                    <MangaCard key={manga.id} manga={manga} />
                  ))}
                </div>
              </section>
            </AnimatedContainer>

            <AnimatedContainer viewport>
              <HomeNewsSection />
            </AnimatedContainer>
          </div>

          <div className="space-y-6">
            <ContinueReadingSection />

            <QuestPanelWrapper />

            <AnimatedContainer viewport>
              <HomeRankingsSidebar topMangas={topMangas} />
            </AnimatedContainer>

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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
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
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={manga.coverUrl} alt={manga.title} className="w-full h-full object-cover" />
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
