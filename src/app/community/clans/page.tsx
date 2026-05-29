import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import {
  Users,
  Plus,
  Crown,
  Flame,
  ChevronLeft,
  ChevronRight,
  Shield,
  Medal,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

import ClansFilters from './ClansFilters';
import ClanCard from '@/components/Clan/ClanCard';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.clans.title');
  const description = t('page.clans.description');

  return {
    title,
    description,
  };
}

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
  let userClanSlug: string | null = null;
  if (session?.user?.id) {
    const membership = await prisma.clanMembership.findFirst({
      where: { userId: session.user.id },
      select: { clan: { select: { slug: true } } },
    });
    userClanSlug = membership?.clan?.slug ?? null;
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
    slug: c.slug,
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
    <>
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--primary)]/5 via-[var(--accent-purple)]/5 to-[var(--surface)] pt-20 pb-8 border-b border-[var(--border)]/50">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--primary)]/3 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[var(--accent-purple)]/3 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-[var(--primary)]/10">
                  <Shield className="text-[var(--primary)]" size={24} />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  Clanes
                </h1>
              </div>
              <p className="text-[var(--text-secondary)] mt-1 ml-2">
                Únete a un clan, compite con otros lectores y gana recompensas exclusivas
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!userClanSlug && (
                <Link
                  href="/community/clans/create"
                  className="group bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:from-[var(--primary-hover)] hover:to-[var(--accent-purple-hover)] text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus size={20} className="transition-transform duration-300 group-hover:rotate-90" />
                  Crear Clan
                </Link>
              )}
              {userClanSlug && (
                <Link
                  href={`/community/clan/${userClanSlug}`}
                  className="bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-primary)] px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Crown size={20} className="text-[var(--warning)]" />
                  Mi Clan
                </Link>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-lg">
            <div className="bg-[var(--surface)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)] p-3 text-center">
              <span className="text-lg font-black text-[var(--primary)]">{total}</span>
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-0.5">Clanes</p>
            </div>
            <div className="bg-[var(--surface)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)] p-3 text-center">
              <span className="text-lg font-black text-[var(--warning)]">
                {clansWithCount.reduce((sum, c) => sum + c.memberCount, 0)}
              </span>
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-0.5">Miembros</p>
            </div>
            <div className="bg-[var(--surface)]/60 backdrop-blur-sm rounded-xl border border-[var(--border)] p-3 text-center">
              <span className="text-lg font-black text-[var(--accent-purple)]">
                {totalPages}
              </span>
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-0.5">Páginas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Season Info Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-[var(--accent-purple)]/10 border border-amber-500/20 p-6 mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex flex-col sm:flex-row items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 flex-shrink-0">
              <Flame className="text-amber-400" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                Temporada en Curso
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 uppercase tracking-wider">
                  Activa
                </span>
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
                Compite con otros clanes para ganar recompensas exclusivas. Los mejores clanes
                recibirán Aura y badges especiales al final de la temporada.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="bg-[var(--surface)]/60 backdrop-blur-sm border border-amber-400/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <Medal size={18} className="text-amber-400" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Top 1</p>
                    <p className="font-bold text-amber-400">10,000 Aura</p>
                  </div>
                </div>
                <div className="bg-[var(--surface)]/60 backdrop-blur-sm border border-slate-400/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <Medal size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Top 2</p>
                    <p className="font-bold text-slate-300">5,000 Aura</p>
                  </div>
                </div>
                <div className="bg-[var(--surface)]/60 backdrop-blur-sm border border-amber-600/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
                  <Medal size={18} className="text-amber-600" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Top 3</p>
                    <p className="font-bold text-amber-600">3,000 Aura</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Suspense fallback={<div className="h-12 bg-[var(--surface-sunken)] rounded-xl animate-pulse" />}>
          <ClansFilters />
        </Suspense>

        {/* Clans Grid */}
        {clansWithCount.length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface)]/50 rounded-2xl border border-[var(--border)]">
            <div className="p-4 w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
              <Users className="text-[var(--text-tertiary)]" size={28} />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              No se encontraron clanes
            </h3>
            <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
              {search
                ? 'No hay clanes que coincidan con tu búsqueda. Intenta con otros términos.'
                : 'Sé el primero en crear un clan y lidera a tu comunidad hacia la victoria.'}
            </p>
             {!userClanSlug && (
              <Link
                href="/community/clans/create"
                className="inline-flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-[var(--primary)]/20"
              >
                <Plus size={20} />
                Crear Clan
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[var(--text-tertiary)]">
                Mostrando {clansWithCount.length} de {total} clanes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clansWithCount.map((clan, idx) => (
                <ClanCard
                  key={clan.id}
                  clan={clan}
                  index={idx}
                  rank={idx + 1 + (page - 1) * LIMIT}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Paginación">
                {page > 1 ? (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-sunken)] hover:border-[var(--primary)]/30 transition-all"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={20} className="text-[var(--text-primary)]" />
                  </Link>
                ) : (
                  <span className="p-2.5 rounded-xl border border-[var(--border)] opacity-30 cursor-not-allowed">
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
                        <span className="text-[var(--text-tertiary)] px-1 text-sm">...</span>
                      )}
                      <Link
                        href={buildPageUrl(p)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all flex items-center justify-center text-sm ${
                          p === page
                            ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] text-white shadow-md shadow-[var(--primary)]/30'
                            : 'border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)] hover:border-[var(--primary)]/30'
                        }`}
                      >
                        {p}
                      </Link>
                    </span>
                  ))}

                {page < totalPages ? (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="p-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-sunken)] hover:border-[var(--primary)]/30 transition-all"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={20} className="text-[var(--text-primary)]" />
                  </Link>
                ) : (
                  <span className="p-2.5 rounded-xl border border-[var(--border)] opacity-30 cursor-not-allowed">
                    <ChevronRight size={20} className="text-[var(--text-primary)]" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
