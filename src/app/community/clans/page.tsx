import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import ClanCard from '@/components/Clan/ClanCard';
import ClansFilters from './ClansFilters';
import Link from 'next/link';
import {
  Users,
  Trophy,
  Plus,
  Crown,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Clanes | Inkverse',
  description: 'Únete a un clan y compite con otros lectores en las temporadas',
};

interface ClansPageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    page?: string;
  }>;
}

const VALID_SORT = ['monthlyScore', 'totalScore', 'name'] as const;
const LIMIT = 20;

export default async function ClansPage({ searchParams }: ClansPageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const sortBy = VALID_SORT.includes(params.sortBy as (typeof VALID_SORT)[number])
    ? (params.sortBy as (typeof VALID_SORT)[number])
    : 'monthlyScore';
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  // Session (for user's clan badge)
  const session = await auth();
  let userClanId: string | null = null;
  if (session?.user?.id) {
    const membership = await prisma.clanMembership.findFirst({
      where: { userId: session.user.id },
      select: { clanId: true },
    });
    userClanId = membership?.clanId ?? null;
  }

  // Build query
  const where = search ? { name: { contains: search } } : {};

  const orderBy: Record<string, string> = {};
  if (sortBy === 'name') {
    orderBy.name = 'asc';
  } else {
    orderBy[sortBy] = 'desc';
  }

  const skip = (page - 1) * LIMIT;

  const [clans, total] = await Promise.all([
    prisma.clan.findMany({
      where,
      orderBy,
      skip,
      take: LIMIT,
      include: {
        _count: { select: { members: true } },
      },
    }),
    prisma.clan.count({ where }),
  ]);

  const totalPages = Math.ceil(total / LIMIT);

  const clansWithCount = clans.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    emblemUrl: c.emblemUrl,
    totalScore: c.totalScore,
    monthlyScore: c.monthlyScore,
    memberCount: c._count.members,
  }));

  // Build URL for pagination links
  const buildPageUrl = (p: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set('search', search);
    if (sortBy !== 'monthlyScore') sp.set('sortBy', sortBy);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/community/clans${qs ? '?' + qs : ''}`;
  };

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--primary)]/10 to-[var(--accent-purple)]/10 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3">
                <Users className="text-[var(--primary)]" size={36} />
                Clanes
              </h1>
              <p className="text-[var(--text-secondary)] mt-2 text-lg">
                Únete a un clan y compite con otros lectores en las temporadas
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!userClanId && (
                <Link
                  href="/community/clans/create"
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20"
                >
                  <Plus size={20} />
                  Crear Clan
                </Link>
              )}
              {userClanId && (
                <Link
                  href={`/community/clan/${userClanId}`}
                  className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-primary)] px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Crown size={20} className="text-[var(--warning)]" />
                  Mi Clan
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Season Info Banner */}
        <div className="bg-gradient-to-r from-[var(--warning)]/10 to-[var(--accent-purple)]/10 border border-[var(--warning)]/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="text-[var(--warning)]" size={28} />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Temporada en Curso</h2>
          </div>
          <p className="text-[var(--text-secondary)]">
            Compite con otros clanes para ganar recompensas exclusivas. Los mejores clanes
            recibirán InkCoins y badges especiales al final de la temporada.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-4 py-2">
              <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Top 1</span>
              <p className="font-bold text-[var(--warning)] flex items-center gap-1">
                <Trophy size={14} /> 10,000 InkCoins
              </p>
            </div>
            <div className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-4 py-2">
              <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Top 2</span>
              <p className="font-bold text-[var(--text-secondary)] flex items-center gap-1">
                <Trophy size={14} /> 5,000 InkCoins
              </p>
            </div>
            <div className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-4 py-2">
              <span className="text-xs text-[var(--text-muted)] uppercase font-semibold">Top 3</span>
              <p className="font-bold text-[var(--accent-orange)] flex items-center gap-1">
                <Trophy size={14} /> 3,000 InkCoins
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters (client component) */}
        <Suspense fallback={<div className="h-10 bg-[var(--surface-sunken)] rounded-xl" />}>
          <ClansFilters />
        </Suspense>

        {/* Clans Grid */}
        {clansWithCount.length === 0 ? (
          <div className="text-center py-20">
            <Users className="mx-auto text-[var(--text-muted)] mb-4" size={48} />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              No se encontraron clanes
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {search ? 'Intenta con otra búsqueda' : 'Sé el primero en crear un clan'}
            </p>
            {!userClanId && (
              <Link
                href="/community/clans/create"
                className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] px-6 py-3 rounded-xl font-bold transition-all"
              >
                <Plus size={20} />
                Crear Clan
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clansWithCount.map((clan, idx) => (
                <ClanCard
                  key={clan.id}
                  clan={clan}
                  index={idx}
                  rank={idx + 1 + (page - 1) * LIMIT}
                  isUserClan={clan.id === userClanId}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Paginación">
                {page > 1 ? (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-sunken)] transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={20} className="text-[var(--text-primary)]" />
                  </Link>
                ) : (
                  <span className="p-2 rounded-lg border border-[var(--border)] opacity-50 cursor-not-allowed">
                    <ChevronLeft size={20} className="text-[var(--text-primary)]" />
                  </span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 2
                  )
                  .map((p, idx, arr) => (
                    <span key={p} className="contents">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-[var(--text-muted)] px-2">...</span>
                      )}
                      <Link
                        href={buildPageUrl(p)}
                        className={`w-10 h-10 rounded-lg font-bold transition-colors flex items-center justify-center ${
                          p === page
                            ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                            : 'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
                        }`}
                      >
                        {p}
                      </Link>
                    </span>
                  ))}

                {page < totalPages ? (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-sunken)] transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={20} className="text-[var(--text-primary)]" />
                  </Link>
                ) : (
                  <span className="p-2 rounded-lg border border-[var(--border)] opacity-50 cursor-not-allowed">
                    <ChevronRight size={20} className="text-[var(--text-primary)]" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
