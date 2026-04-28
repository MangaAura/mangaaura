import { prisma } from '@/lib/prisma';
import { MangaCard } from '@/components/MangaCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Trophy, TrendingUp, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

async function getHomeData() {
  const [latestMangas, topMangas, updatingMangas, topUsers] = await Promise.all([
    // Últimos mangas
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
        rating: true,
        _count: { select: { chapters: true } },
      },
    }),
    // Top mangas
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
        rating: true,
        totalViews: true,
        _count: { select: { chapters: true } },
      },
    }),
    // Mangas actualizados recientemente
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
        rating: true,
        _count: { select: { chapters: true } },
      },
    }),
    // Top usuarios
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
  ]);

  return {
    latestMangas,
    topMangas,
    updatingMangas,
    topUsers,
  };
}

export default async function HomePage() {
  const { latestMangas, topMangas, updatingMangas, topUsers } = await getHomeData();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Descubre el Futuro del Manga
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6">
            Lee mangas generados por IA, gana XP, únete a clanes y conviértete en una
            Leyenda del Manga.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/browse">
              <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-white/90">
                <Sparkles className="w-5 h-5 mr-2" />
                Explorar Mangas
              </Button>
            </Link>
            <Link href="/rankings">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Trophy className="w-5 h-5 mr-2" />
                Ver Rankings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Top Mangas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Top Mangas
          </h2>
          <Link href="/rankings">
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {topMangas.map((manga) => (
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
                rating: manga.rating,
                chapterCount: manga._count.chapters,
              }}
            />
          ))}
        </div>
      </section>

      {/* Grid de contenido */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Últimas Actualizaciones */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-500" />
              Últimas Actualizaciones
            </h2>
            <Link href="/browse">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
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
                tags: JSON.parse(manga.tags || '[]'),
                authorName: manga.authorName,
                rating: manga.rating || 0,
                chapterCount: manga._count?.chapters || 0,
              }}
            />
          ))}
            </div>
        </section>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Lectores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Lectores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-lg font-bold text-slate-400 w-6">
                      #{index + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-slate-500">
                        Nivel {user.level} • {user.xpPoints} XP
                      </p>
                    </div>
                  </div>
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
              {latestMangas.slice(0, 3).map((manga) => (
                <Link
                  key={manga.id}
                  href={`/manga/${manga.slug}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-12 h-16 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                    {manga.coverUrl ? (
                      <img
                        src={manga.coverUrl}
                        alt={manga.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {manga.title}
                    </p>
                    <p className="text-xs text-slate-500">{manga.authorName}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Creator */}
      <section className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ¿Eres un Creador de IA?
            </h2>
            <p className="text-slate-600">
              Publica tus mangas, gana InkCoins y construye tu audiencia.
            </p>
          </div>
          <Link href="/creator/upload">
            <Button size="lg" variant="ink">
              Comenzar a Crear
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
