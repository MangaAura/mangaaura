import { prisma } from '@/lib/prisma';

import { SimpleGenreMarquee } from '@/components/SimpleGenreMarquee';
import { MangaCard } from '@/components/MangaCard';
import { HomeNewsSection } from '@/components/Home/HomeNewsSection';
import { HomeRankingsSidebar } from '@/components/Home/HomeRankingsSidebar';
import { AnimatedHero } from '@/components/Home/AnimatedHero';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { QuestPanelWrapper } from '@/components/Home/QuestPanelWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags as string[];
  if (typeof tags === 'string') {
    try { return JSON.parse(tags); } catch { return []; }
  }
  return [];
}

export default async function HomePage() {
  const [latestMangas, topMangas, updatingMangas, topUsers, featuredManga, totalMangas, totalReaders, totalChapters] = await Promise.all([
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 5,
      orderBy: { totalViews: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, totalViews: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, coverUrl: true, status: true,
        tags: true, authorName: true, author: { select: { username: true } },
        rating: true, _count: { select: { chapters: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { xpPoints: 'desc' },
      select: { id: true, username: true, avatarUrl: true, level: true, xpPoints: true },
    }),
    prisma.mangaSeries.findFirst({
      where: { totalViews: { gt: 0 } },
      orderBy: { totalViews: 'desc' },
      select: { id: true, title: true, slug: true, coverUrl: true, description: true, authorName: true },
    }),
    prisma.mangaSeries.count(),
    prisma.user.count(),
    prisma.chapter.count(),
  ]);

  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary">
      <AnimatedHero
        title={featuredManga?.title ?? 'InkVerse'}
        description={featuredManga?.description ?? 'Tu plataforma de manga favorita con miles de títulos para explorar.'}
        coverUrl={featuredManga?.coverUrl ?? null}
        mangaSlug={featuredManga?.slug ?? ''}
        totalMangas={totalMangas}
        totalReaders={totalReaders}
        totalChapters={totalChapters}
      />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <SimpleGenreMarquee />

        <AnimatedContainer viewport>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🏆 Top Mangas
            </h2>
            <Link href="/rankings">
              <Button variant="ghost" size="sm">Ver todo →</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topMangas.map((manga, index) => (
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

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            <AnimatedContainer viewport>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    🕐 Últimas Actualizaciones
                  </h2>
                  <Link href="/browse">
                    <Button variant="ghost" size="sm">Ver todo →</Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {updatingMangas.map((manga) => (
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

            <AnimatedContainer viewport>
              <HomeNewsSection />
            </AnimatedContainer>
          </div>

          <div className="space-y-6">
            <QuestPanelWrapper />

            <AnimatedContainer viewport>
              <HomeRankingsSidebar topMangas={topMangas} />
            </AnimatedContainer>

            <AnimatedContainer viewport>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    📈 Top Lectores
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
                          <p className="text-xs text-muted">Nivel {user.level}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/rankings">
                    <Button variant="outline" className="w-full mt-4">Ver Ranking Completo</Button>
                  </Link>
                </CardContent>
              </Card>
            </AnimatedContainer>

            <AnimatedContainer viewport>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🆕 Nuevos Mangas</CardTitle>
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
                <Link href="/discover" className="w-full">
                  <Button variant="outline" className="w-full">Ver Todos los Nuevos</Button>
                </Link>
              </Card>
            </AnimatedContainer>
          </div>
        </div>

        <AnimatedContainer viewport>
          <section className="bg-gradient-to-r from-accent-purple/20 via-accent-purple/10 to-accent-blue/20 border border-accent-purple/30 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">¿Eres creador de manga?</h2>
                <p className="text-muted">Únete a InkVerse y reaches a miles de lectores.</p>
              </div>
              <a
                href="/creator/upload"
                className="inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-medium transition-all hover:opacity-90 text-white"
                style={{ background: 'linear-gradient(to right, var(--accent-purple), var(--primary))' }}
              >
                ✨ Empezar a crear
              </a>
            </div>
          </section>
        </AnimatedContainer>
      </div>
    </div>
  );
}