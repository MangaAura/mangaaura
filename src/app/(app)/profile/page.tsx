import {
  BookOpen,
  Trophy,
  Heart,
  Users,
  Settings,
  Crown,
  Flame,
  Star,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const metadata: Metadata = {
  title: 'Mi Perfil | Inkverse',
  description: 'Tu perfil y estadísticas',
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/profile');
  }

  // Fetch user data with stats
  const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  include: {
  _count: {
  select: {
  library: true,
  collections: true,
  following: true,
  achievements: true,
  },
  },
  achievements: {
  include: {
  achievement: true,
  },
  orderBy: { unlockedAt: 'desc' },
  take: 3,
  },
  readingProgress: {
  orderBy: { updatedAt: 'desc' },
  take: 5,
  include: {
  manga: {
  select: {
  id: true,
  title: true,
  slug: true,
  coverUrl: true,
  },
  },
  chapter: {
  select: {
  chapterNumber: true,
  },
  },
  },
  },
  },
  });

  if (!user) {
  redirect('/auth/login');
  }

  const userProfile = user as any;

  // Calculate level progress
  const xpForNextLevel = user.level * 100;
  const xpProgress = Math.min(100, (user.xpPoints / xpForNextLevel) * 100);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-[var(--primary)]">
                {user.displayName?.[0] || user.username[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                  {user.displayName || user.username}
                </h1>
                {user.role !== 'USER' && (
                  <Badge
                    className={
                      user.role === 'ADMIN'
            ? 'bg-[var(--error)]/20 text-[var(--error)]'
            : 'bg-[var(--primary)]/20 text-[var(--primary)]'
                    }
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Moderador'}
                  </Badge>
                )}
              </div>
              <p className="text-[var(--text-secondary)]">@{user.username}</p>

              {/* Level & XP */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[var(--warning)]" />
            <span className="font-bold text-[var(--text-primary)]">Nivel {user.level}</span>
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {user.xpPoints} / {xpForNextLevel} XP
                  </span>
                </div>
                <Progress value={xpProgress} className="h-2" />
              </div>
            </div>

            <Link href="/settings">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
            <StatCard
              icon={BookOpen}
              value={userProfile._count.library}
              label="Mangas en biblioteca"
            />
            <StatCard
              icon={Heart}
              value={userProfile._count.following}
              label="Siguiendo"
            />
            <StatCard
              icon={Users}
              value={userProfile._count.collections}
              label="Colecciones"
            />
            <StatCard
              icon={Trophy}
              value={userProfile._count.achievements}
              label="Logros"
            />
          </div>
        </Card>

        {/* Content */}
        <Tabs defaultValue="reading" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reading">
              <BookOpen className="w-4 h-4 mr-2" />
              Lectura
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Logros
            </TabsTrigger>
            <TabsTrigger value="collections">
              <Star className="w-4 h-4 mr-2" />
              Colecciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reading">
            <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-[var(--accent-orange)]" />
                Continuar leyendo
              </h2>

              {userProfile.readingProgress.length === 0 ? (
<EmptyState
              title="Sin resultados"
              description="No se encontraron mangas con los filtros seleccionados"
            />
              ) : (
                <div className="space-y-4">
                  {userProfile.readingProgress.map((progress: any) => (
                    <Link
                      key={progress.id}
                      href={`/manga/${progress.manga.slug}/chapter/${progress.chapter?.chapterNumber || 1}`}
                      className="flex items-center gap-4 p-4 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors"
                    >
                      <div className="w-16 h-20 bg-[var(--surface-sunken)] rounded overflow-hidden">
                        {progress.manga.coverUrl ? (
                          <OptimizedImage
                            src={progress.manga.coverUrl}
                            alt={progress.manga.title}
                            fill
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)] text-xs">
                            {progress.manga.title[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
            <h3 className="font-medium text-[var(--text-primary)]">
              {progress.manga.title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
                          Capítulo {progress.chapter?.chapterNumber || '?'}
                        </p>
                        <div className="mt-2">
                          <Progress
                            value={progress.progress}
                            className="h-1.5 w-32"
                          />
                        </div>
                      </div>
                      <Button size="sm">Continuar</Button>
                    </Link>
                  ))}
              </div>
              )}
              <div className="mt-4 text-center">
                <Link href="/reading-history" className="text-sm text-accent-blue hover:underline font-semibold">
                  Ver historial completo →
                </Link>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Logros recientes
        </h2>

              {userProfile.achievements.length === 0 ? (
<EmptyState
              title="Tu biblioteca está vacía"
              description="Comienza a agregar mangas para verlos aquí"
              action={{ label: 'Explorar mangas', href: '/browse' }}
            />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userProfile.achievements.map((ua: any) => (
                    <Card
                      key={ua.id}
          className="p-4 border-[var(--warning)]/30 bg-[var(--warning)]/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--warning)]/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-[var(--warning)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">
                {ua.achievement.name}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                            {ua.achievement.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Link href="/achievements">
                <Button variant="outline" className="w-full mt-4">
                  Ver todos los logros
                </Button>
              </Link>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Mis colecciones
                </h2>
                <Link href="/collections/create">
                  <Button size="sm">Crear colección</Button>
                </Link>
              </div>

              <Link href="/collections">
                <Button variant="outline" className="w-full">
                  Ver mis colecciones
                </Button>
              </Link>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">
    <div className="flex items-center justify-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
      <span className="text-2xl font-bold text-[var(--text-primary)]">{value}</span>
    </div>
    <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
  </div>
  );
}
