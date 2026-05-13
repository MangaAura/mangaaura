import { prisma } from '@/lib/prisma';
import { MangaCard } from '@/components/MangaCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, TrendingUp, Clock, Sparkles, Star, Play, Swords, Heart, Ghost, Rocket, Users, Compass } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { HomeNewsSection } from '@/components/Home/HomeNewsSection';
import { HomeRankingsSidebar } from '@/components/Home/HomeRankingsSidebar';
import { AnimatedHero } from '@/components/Home/AnimatedHero';

const GENRE_CATEGORIES = [
  { label: 'Acción', icon: Swords, slug: 'accion', color: 'bg-accent-red/10 text-accent-red border-accent-red/20 hover:bg-accent-red/20' },
  { label: 'Aventura', icon: Compass, slug: 'aventura', color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20 hover:bg-accent-blue/20' },
  { label: 'Romance', icon: Heart, slug: 'romance', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20' },
  { label: 'Terror', icon: Ghost, slug: 'terror', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
  { label: 'Fantasía', icon: Sparkles, slug: 'fantasia', color: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20 hover:bg-accent-purple/20' },
  { label: 'Sci-Fi', icon: Rocket, slug: 'sci-fi', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20' },
  { label: 'Comedia', icon: Star, slug: 'comedia', color: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20 hover:bg-accent-orange/20' },
  { label: 'Drama', icon: Users, slug: 'drama', color: 'bg-accent-green/10 text-accent-green border-accent-green/20 hover:bg-accent-green/20' },
];

async function getHomeData() {
  const [latestMangas, topMangas, updatingMangas, topUsers, featuredManga] = await Promise.all([
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        status: true,
        tags: true,
        authorName: true,
        author: { select: { username: true } },
        rating: true,
        _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 5,
      orderBy: { totalViews: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        status: true,
        tags: true,
        authorName: true,
        author: { select: { username: true } },
        rating: true,
        totalViews: true,
        _count: { select: { chapters: true } },
      },
    }),
    prisma.mangaSeries.findMany({
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        status: true,
        tags: true,
        authorName: true,
        author: { select: { username: true } },
        rating: true,
        _count: { select: { chapters: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { xpPoints: 'desc' },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        level: true,
        xpPoints: true,
      },
    }),
    prisma.mangaSeries.findFirst({
      where: { totalViews: { gt: 0 } },
      orderBy: { totalViews: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        coverUrl: true,
        description: true,
        authorName: true,
        author: { select: { username: true } },
      },
    }),
  ]);

  return {
    latestMangas,
    topMangas,
    updatingMangas,
    topUsers,
    featuredManga,
  };
}

export default async function HomePage() {
  const { latestMangas, topMangas, updatingMangas, topUsers, featuredManga } = await getHomeData();

  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary">
      {/* Hero Section */}
      {featuredManga ? (
        <AnimatedHero
          title={featuredManga.title}
          description={featuredManga.description
            ? featuredManga.description.length > 200
              ? featuredManga.description.slice(0, 200) + '...'
              : featuredManga.description
            : 'Lee mangas generados por IA, gana XP, únete a clanes y conviértete en una Leyenda del Manga.'}
          coverUrl={featuredManga.coverUrl}
          mangaSlug={featuredManga.slug}
        />
      ) : (
        <section className="relative w-full min-h-[50vh] flex items-center justify-center bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 rounded-2xl">
          <div className="text-center px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
              Descubre el Futuro del Manga
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
              Lee mangas generados por IA, gana XP, únete a clanes y conviértete en una Leyenda del Manga.
            </p>
            <Button className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] px-8 py-3 rounded-xl">
              <a href="/browse" className="flex items-center gap-2">
                <Compass className="w-5 h-5" />
                Explorar Mangas
              </a>
            </Button>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Categorías / Géneros */}
        <section className="animate-fade-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Compass className="text-accent-blue" /> Explora por Género
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {GENRE_CATEGORIES.map((genre) => {
              const Icon = genre.icon;
              return (
                <Link
                  key={genre.slug}
                  href={`/search?genres[]=${genre.slug}&sort=popularity`}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-100 active:translate-y-0 ${genre.color}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-bold">{genre.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Top Mangas */}
        <section className="animate-fade-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="text-[var(--warning)]" /> Top Mangas
            </h2>
            <Link href="/rankings">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topMangas.map((manga: any) => (
              <MangaCard
                key={manga.id}
                manga={{
                  id: manga.id,
                  title: manga.title,
                  slug: manga.slug,
                  coverUrl: manga.coverUrl,
                  status: manga.status,
                  tags: JSON.parse(manga.tags || '[]'),
                  authorName: manga.authorName,
                  authorUsername: manga.author?.username,
                  rating: manga.rating,
                  chapterCount: manga._count.chapters,
                }}
              />
            ))}
          </div>
        </section>

        {/* Grid de contenido */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda: Actualizaciones + Noticias */}
          <div className="lg:col-span-2 space-y-10">
            {/* Últimas Actualizaciones */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Clock className="text-accent-blue" /> Últimas Actualizaciones
                </h2>
                <Link href="/browse">
                  <Button variant="ghost" size="sm">
                    Ver todos
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
                      tags: JSON.parse(manga.tags || '[]'),
                      authorName: manga.authorName,
                      authorUsername: manga.author?.username,
                      rating: manga.rating || 0,
                      chapterCount: manga._count?.chapters || 0,
                    }}
                  />
                ))}
              </div>
            </section>

            {/* Noticias de InkVerse */}
            <HomeNewsSection />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rankings con tabs */}
            <HomeRankingsSidebar topMangas={topMangas} />

            {/* Top Lectores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                  Top Lectores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topUsers.map((user: any, index: any) => (
                    <Link
                      key={user.id}
                      href={"/user/" + user.username}
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
                          Nivel {user.level} • {user.xpPoints} XP
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/rankings">
                  <Button variant="outline" className="w-full mt-4">
                    Ver Rankings Completos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Nuevos Mangas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nuevos Lanzamientos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestMangas.slice(0, 3).map((manga: any) => (
                  <Link
                    key={manga.id}
                    href={`/manga/${manga.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-12 h-16 bg-tertiary rounded overflow-hidden flex-shrink-0">
                      {manga.coverUrl ? (
                        <img
                          src={manga.coverUrl}
                          alt={manga.title}
                          className="w-full h-full object-cover"
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
            </Card>
          </div>
        </div>

          {/* CTA Creator */}
        <section className="bg-gradient-to-r from-accent-purple/20 to-accent-blue/10 dark:from-accent-purple/30 dark:to-accent-blue/20 border border-accent-purple/30 dark:border-accent-purple/50 rounded-2xl p-8 animate-fade-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¿Eres un Creador de IA?
              </h2>
              <p className="text-muted">
                Publica tus mangas, gana InkCoins y construye tu audiencia.
              </p>
            </div>
<Link href="/creator/upload">
          <button
            className="inline-flex items-center justify-center h-11 px-8 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[var(--text-inverse)] hover:opacity-90"
            style={{ background: 'linear-gradient(to right, var(--accent-purple), var(--primary))' }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Comenzar a Crear
          </button>
        </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
