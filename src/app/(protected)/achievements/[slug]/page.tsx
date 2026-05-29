import {
  ArrowLeft,
  Trophy,
  Star,
  Lock,
  Sparkles,
  Target,
  Clock,
  ChevronRight,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AchievementDetailClient } from './AchievementDetailClient';
import { getAchievementBySlug } from './getAchievementBySlug';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Difficulty } from '@/hooks/useAchievements';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';

// ─── Metadata ──────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await detectLocale();
  const t = getT(locale);
  const achievement = await getAchievementBySlug(slug);
  if (!achievement) {
    return { title: `${t('page.achievementNotFound.title')} | MangaAura` };
  }
  return {
    title: `${achievement.name} | Logros | MangaAura`,
    description: achievement.description,
    openGraph: {
      title: `${achievement.name} | Logros MangaAura`,
      description: achievement.description,
      images: [
        {
          url: `/api/achievements/${encodeURIComponent(achievement.badgeId)}/og?name=${encodeURIComponent(achievement.name)}&rarity=${achievement.rarity}&xp=${achievement.xpReward}&badge=${encodeURIComponent(achievement.badgeId)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

// ─── Data types ─────────────────────────────────────────────────────

interface RelatedAchievement {
  id: string;
  badgeId: string;
  name: string;
  rarity: Difficulty;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ─── Rarity config ──────────────────────────────────────────────────

const RARITY_COLORS: Record<
  Difficulty,
  { gradient: string; bg: string; border: string; text: string; label: string }
> = {
  EASY: {
    gradient: 'from-[#22c55e] to-[#16a34a]',
    bg: 'bg-[#22c55e]/10',
    border: 'border-[#22c55e]/30',
    text: 'text-[#22c55e]',
    label: 'Común',
  },
  MEDIUM: {
    gradient: 'from-[#3b82f6] to-[#2563eb]',
    bg: 'bg-[#3b82f6]/10',
    border: 'border-[#3b82f6]/30',
    text: 'text-[#3b82f6]',
    label: 'Raro',
  },
  HARD: {
    gradient: 'from-[#8b5cf6] to-[#7c3aed]',
    bg: 'bg-[#8b5cf6]/10',
    border: 'border-[#8b5cf6]/30',
    text: 'text-[#8b5cf6]',
    label: 'Épico',
  },
  LEGENDARY: {
    gradient: 'from-[#f59e0b] to-[#ea580c]',
    bg: 'bg-[#f59e0b]/10',
    border: 'border-[#f59e0b]/40',
    text: 'text-[#f59e0b]',
    label: 'Legendario',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  READING: 'Lectura',
  SOCIAL: 'Social',
  CREATION: 'Creación',
  MILESTONE: 'Hito',
};

const CONDITION_LABELS: Record<string, string> = {
  CHAPTERS_READ: 'Capítulos leídos',
  MANGAS_COMPLETED: 'Mangas completados',
  MANGAS_CREATED: 'Mangas creados',
  LEVEL_REACHED: 'Nivel alcanzado',
  STREAK_REACHED: 'Días de racha',
  STREAK_DAYS: 'Días de racha',
  READING_STREAK: 'Días de racha',
  COMMENTS_POSTED: 'Comentarios publicados',
  COMMENT_LIKES_RECEIVED: 'Likes recibidos',
  QUESTS_COMPLETED: 'Misiones completadas',
  CORRECTIONS_APPROVED: 'Correcciones aprobadas',
  SPONSORSHIPS_WON: 'Patrocinios ganados',
};

// ─── Data fetching ──────────────────────────────────────────────────

async function getRelatedAchievements(
  category: string,
  excludeId: string
): Promise<RelatedAchievement[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const session = await auth();
    const userId = session?.user?.id;

    const achievements = await prisma.achievementDefinition.findMany({
      where: {
        category,
        id: { not: excludeId },
      },
      orderBy: { xpReward: 'asc' },
      take: 6,
    });

    let unlockedIds = new Set<string>();
    if (userId) {
      const userAchievements = await prisma.userAchievement.findMany({
        where: {
          userId,
          achievementId: { in: achievements.map((a) => a.id) },
        },
      });
      // Filter in JS: Prisma SQLite adapter doesn't support { not: null } on DateTime fields
      unlockedIds = new Set(
        userAchievements
          .filter((ua) => ua.unlockedAt !== null)
          .map((ua) => ua.achievementId)
      );
    }

    return achievements.map((ach) => ({
      id: ach.id,
      badgeId: ach.badgeId,
      name: ach.name,
      rarity: ach.difficulty as Difficulty,
      xpReward: ach.xpReward,
      unlocked: unlockedIds.has(ach.id),
      unlockedAt: null,
    }));
  } catch {
    return [];
  }
}

// ─── Sub-components ─────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: Difficulty }) {
  const c = RARITY_COLORS[rarity] || RARITY_COLORS.EASY;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
        c.bg,
        c.text,
        c.border,
        'border',
      )}
    >
      <div
        className={cn('w-2 h-2 rounded-full bg-gradient-to-br', c.gradient)}
      />
      {c.label}
    </span>
  );
}

function ConditionDisplay({
  condition,
  progress,
  target,
}: {
  condition: { type: string; count?: number; level?: number; days?: number } | null;
  progress: number;
  target: number;
}) {
  if (!condition) return null;
  const label = CONDITION_LABELS[condition.type] || condition.type;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">Requisito</span>
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] transition-all duration-700"
            style={{ width: `${Math.min((progress / target) * 100, 100)}%` }}
          />
        </div>
        <span className="text-xs text-[var(--text-tertiary)] tabular-nums min-w-[3rem] text-right">
          {progress}/{target}
        </span>
      </div>
    </div>
  );
}

// ─── Page component ─────────────────────────────────────────────────

export default async function AchievementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const achievement = await getAchievementBySlug(slug);

  if (!achievement) {
    notFound();
  }

  const related = await getRelatedAchievements(achievement.category, achievement.id);
  const rarity = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.EASY;
  const categoryLabel = CATEGORY_LABELS[achievement.category] || achievement.category;
  // Calcular si se desbloqueó recientemente (menos de 24 horas)
  // En Server Components, Date.now() se ejecuta en request-time, no en render
  const unlockedTime = achievement.unlockedAt ? new Date(achievement.unlockedAt).getTime() : 0;
  const ONE_DAY_MS = 86400000;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const wasJustUnlocked = unlockedTime > 0 && unlockedTime > now - ONE_DAY_MS;

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-6 min-h-screen bg-background font-sans text-fg-primary">
      {/* Back link */}
      <Link
        href="/achievements"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Volver a Logros
      </Link>

      {/* Hero section */}
      <div
        className={cn(
          'rounded-2xl border p-8 md:p-12',
          achievement.unlocked ? rarity.border : 'border-[var(--border)]',
          achievement.unlocked && rarity.bg,
          'relative overflow-hidden',
        )}
      >
        {/* Background glow for unlocked */}
        {achievement.unlocked && (
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-10',
              rarity.gradient,
            )}
          />
        )}

        {/* Legendary shimmer */}
        {achievement.unlocked && achievement.rarity === 'LEGENDARY' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-rarity-shimmer pointer-events-none" />
        )}

        <div
          className={cn(
            'relative flex flex-col md:flex-row items-center gap-8 md:gap-12',
            wasJustUnlocked && 'animate-badge-pop',
          )}
        >
          {/* Badge */}
          <div className="flex-shrink-0">
            <AchievementDetailClient
              achievement={{
                badgeId: achievement.badgeId,
                name: achievement.name,
                rarity: achievement.rarity,
                xpReward: achievement.xpReward,
                unlocked: achievement.unlocked,
                wasJustUnlocked,
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <RarityBadge rarity={achievement.rarity} />
              <Badge className="bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                <Target className="w-3 h-3 mr-1" />
                {categoryLabel}
              </Badge>
              {achievement.unlocked && achievement.unlockedAt && (
                <Badge className="bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(achievement.unlockedAt).toLocaleDateString('es', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Badge>
              )}
              {wasJustUnlocked && (
                <Badge className="bg-[var(--accent-green)]/20 text-[var(--accent-green)] animate-pulse">
                  <Sparkles className="w-3 h-3 mr-1" />
                  ¡Nuevo!
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              {achievement.name}
            </h1>

            <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-6">
              {achievement.description}
            </p>

            {/* Condition / Progress */}
            <div className="max-w-md mx-auto md:mx-0 mb-6">
              {achievement.unlocked ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--accent-green)]/5 border border-[var(--accent-green)]/10">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-green)]/15 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-[var(--accent-green)]" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-[var(--accent-green)] text-sm">
                      ¡Logro Desbloqueado!
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {achievement.unlockedAt
                        ? new Date(achievement.unlockedAt).toLocaleDateString('es', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <ConditionDisplay
                  condition={achievement.condition}
                  progress={achievement.progress}
                  target={achievement.target}
                />
              )}
            </div>

            {/* XP reward pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--warning)]/10 border border-[var(--warning)]/20">
              <Star className="w-4 h-4 text-[var(--warning)]" />
              <span className="font-bold text-[var(--warning)]">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related achievements */}
      {related.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-[var(--surface-sunken)] rounded-full flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-[var(--primary)]" />
            </div>
            <h2 className="text-lg font-bold">
              Más logros de {categoryLabel}
            </h2>
            <Link
              href="/achievements"
              className="ml-auto text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {related.map((rel) => {
              const relRarity = RARITY_COLORS[rel.rarity] || RARITY_COLORS.EASY;
              return (
                <Link key={rel.id} href={`/achievements/${encodeURIComponent(rel.badgeId.toLowerCase())}`}>
                  <Card
                    className={cn(
                      'p-4 border transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                      rel.unlocked ? relRarity.border : 'border-[var(--border)]',
                      !rel.unlocked && 'opacity-70',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          rel.unlocked ? relRarity.bg : 'bg-[var(--surface-sunken)]',
                        )}
                      >
                        {rel.unlocked ? (
                          <Trophy className={cn('w-5 h-5', relRarity.text)} />
                        ) : (
                          <Lock className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{rel.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={cn('text-[10px] font-semibold', relRarity.text)}>
                            {relRarity.label}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            +{rel.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
