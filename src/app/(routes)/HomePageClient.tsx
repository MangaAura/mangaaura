'use client';

import { Trophy, TrendingUp, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { GenreMarquee } from '@/components/GenreMarquee';
import { AnimatedHero } from '@/components/Home/AnimatedHero';
import { HomeNewsSection } from '@/components/Home/HomeNewsSection';
import { HomeRankingsSidebar } from '@/components/Home/HomeRankingsSidebar';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { MangaCard } from '@/components/MangaCard';
import { QuestPanel } from '@/components/Quest/QuestPanel';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags as string[];
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  return [];
}

interface HomePageClientProps {
  latestMangas: any[];
  topMangas: any[];
  updatingMangas: any[];
  topUsers: any[];
  featuredManga: any | null;
  totalMangas: number;
  totalReaders: number;
  totalChapters: number;
}

export function HomePageClient({
  latestMangas,
  topMangas,
  updatingMangas,
  topUsers,
  featuredManga,
  totalMangas,
  totalReaders,
  totalChapters,
}: HomePageClientProps) {
  const { data: session } = useSession();
  const t = useT();

  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary">
      <AnimatedHero
        title={featuredManga?.title ?? t('home.discoverFuture')}
        description={
          featuredManga?.description
            ? featuredManga.description.length > 200
              ? featuredManga.description.slice(0, 200) + '...'
              : featuredManga.description
            : t('home.description')
        }
        coverUrl={featuredManga?.coverUrl ?? null}
        mangaSlug={featuredManga?.slug ?? ''}
        totalMangas={totalMangas}
        totalReaders={totalReaders}
        totalChapters={totalChapters}
      />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Categorías / Géneros — Infinite Marquee */}
        <GenreMarquee />

        {/* Top Mangas */}
        <AnimatedContainer viewport>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-[var(--warning)]" /> {t('home.topMangas')}
            </h2>
            <Link href="/rankings">
              <Button variant="ghost" size="sm">
                {t('common.viewAll')}
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topMangas.map((manga: any, index: number) => (
              <AnimatedContainer key={manga.id} animation="fadeInUp" delay={index * 0.08}>
                <MangaCard
                  manga={{
                    id: manga.id,
                    title: manga.title,
                    slug: manga.slug,
                    coverUrl: manga.coverUrl,
                    status: manga.status,
                    tags: parseTags(manga.tags),
                    authorName: manga.authorName,
                    authorUsername: manga.author?.username,
                    rating: manga.rating,
                    chapterCount: manga._count?.chapters ?? 0,
                  }}
                />
              </AnimatedContainer>
            ))}
          </div>
        </AnimatedContainer>

        {/* Grid de contenido */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda: Actualizaciones + Noticias */}
          <div className="lg:col-span-2 space-y-10">
            {/* Últimas Actualizaciones */}
            <AnimatedContainer viewport>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="text-accent-blue" /> {t('home.latestUpdates')}
                  </h2>
                  <Link href="/browse">
                    <Button variant="ghost" size="sm">
                      {t('common.viewAll')}
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {updatingMangas.map((manga: any) => (
                    <MangaCard
                      key={manga.id}
                      manga={{
                        id: manga.id,
                        title: manga.title,
                        slug: manga.slug,
                        coverUrl: manga.coverUrl,
                        status: manga.status,
                        tags: parseTags(manga.tags),
                        authorName: manga.authorName,
                        authorUsername: manga.author?.username,
                        rating: manga.rating || 0,
                        chapterCount: manga._count?.chapters || 0,
                      }}
                    />
                  ))}
                </div>
              </section>
            </AnimatedContainer>

            {/* Noticias de InkVerse */}
            <AnimatedContainer viewport>
              <HomeNewsSection />
            </AnimatedContainer>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Misiones diarias y semanales (solo usuarios autenticados) */}
            {session?.user && (
              <AnimatedContainer viewport>
                <QuestPanel />
              </AnimatedContainer>
            )}

            {/* Rankings con tabs */}
            <AnimatedContainer viewport>
              <HomeRankingsSidebar topMangas={topMangas} />
            </AnimatedContainer>

            {/* Top Lectores */}
            <AnimatedContainer viewport>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                    {t('home.topReaders')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topUsers.map((user: any, index: any) => (
                      <Link
                        key={user.id}
                        href={'/user/' + user.username}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-tertiary transition-colors"
                      >
                        <span className="text-lg font-bold text-muted w-6">
                          #{index + 1}
                        </span>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center text-[var(--text-inverse)] font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-muted">
                            {t('home.levelAndXp', { level: user.level, xp: user.xpPoints })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/rankings">
                    <Button variant="outline" className="w-full mt-4">
                      {t('home.viewFullRankings')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedContainer>

            {/* Nuevos Mangas */}
            <AnimatedContainer viewport>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('home.newReleases')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {latestMangas.slice(0, 3).map((manga: any) => (
                    <Link
                      key={manga.id}
                      href={`/manga/${manga.slug}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-12 h-16 bg-tertiary rounded overflow-hidden flex-shrink-0 relative">
                        {manga.coverUrl ? (
                          <OptimizedImage
                            src={manga.coverUrl}
                            alt={manga.title}
                            fill
                            objectFit="cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)]" />
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
                    <Button variant="outline" className="w-full">
                      {t('home.viewAllNewReleases')}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </AnimatedContainer>
          </div>
        </div>

        {/* CTA Creator */}
        <AnimatedContainer viewport>
          <section className="relative bg-gradient-to-r from-accent-purple/20 via-accent-purple/10 to-accent-blue/20 dark:from-accent-purple/30 dark:via-accent-purple/15 dark:to-accent-blue/20 border border-accent-purple/30 dark:border-accent-purple/50 rounded-2xl p-8 md:p-12 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent-purple/20 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {t('home.ctaCreatorTitle')}
                </h2>
                <p className="text-muted">
                  {t('home.ctaCreatorDesc')}
                </p>
              </div>
              <Link
                href="/creator/upload"
                className="inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-medium transition-all hover:opacity-90 text-[var(--text-inverse)] cursor-pointer"
                style={{ background: 'linear-gradient(to right, var(--accent-purple), var(--primary))' }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('home.startCreating')}
              </Link>
            </div>
          </section>
        </AnimatedContainer>
      </div>
    </div>
  );
}
