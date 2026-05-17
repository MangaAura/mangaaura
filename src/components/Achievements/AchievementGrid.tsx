'use client';

import { useState, useMemo } from 'react';
import { AchievementCard, adaptAchievement } from './AchievementCard';
import type { AchievementUI } from './AchievementCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Trophy, Lock, Unlock, Target, Zap, BookOpen, Users, Star } from 'lucide-react';
import type { AchievementWithProgress, Difficulty } from '@/hooks/useAchievements';

interface AchievementGridProps {
  achievements: AchievementWithProgress[];
  isLoading?: boolean;
  showStats?: boolean;
}

const categories = [
  { id: 'ALL', label: 'Todos', icon: Trophy },
  { id: 'READING', label: 'Lectura', icon: BookOpen },
  { id: 'SOCIAL', label: 'Social', icon: Users },
  { id: 'CREATOR', label: 'Creador', icon: Star },
  { id: 'MILESTONE', label: 'Hitos', icon: Target },
  { id: 'general', label: 'General', icon: Trophy },
];

const rarities: (Difficulty | 'ALL')[] = ['ALL', 'EASY', 'MEDIUM', 'HARD', 'LEGENDARY'];

const RARITY_LABELS: Record<string, string> = {
  ALL: 'Todas las rarezas',
  EASY: 'Fácil',
  MEDIUM: 'Medio',
  HARD: 'Difícil',
  LEGENDARY: 'Legendario',
};

export function AchievementGrid({ achievements, isLoading, showStats = true }: AchievementGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRarity, setSelectedRarity] = useState<Difficulty | 'ALL'>('ALL');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const adaptedAchievements: AchievementUI[] = useMemo(
    () => achievements.map(adaptAchievement),
    [achievements]
  );

  const stats = useMemo(() => {
    const total = adaptedAchievements.length;
    const unlocked = adaptedAchievements.filter((a) => a.userAchievement).length;
    const totalPoints = adaptedAchievements
      .filter((a) => a.userAchievement)
      .reduce((sum, a) => sum + a.points, 0);
    const byRarity: Record<string, number> = {
      EASY: adaptedAchievements.filter((a) => a.rarity === 'EASY' && a.userAchievement).length,
      MEDIUM: adaptedAchievements.filter((a) => a.rarity === 'MEDIUM' && a.userAchievement).length,
      HARD: adaptedAchievements.filter((a) => a.rarity === 'HARD' && a.userAchievement).length,
      LEGENDARY: adaptedAchievements.filter((a) => a.rarity === 'LEGENDARY' && a.userAchievement).length,
    };

    return { total, unlocked, totalPoints, byRarity };
  }, [adaptedAchievements]);

  const filteredAchievements = useMemo(() => {
    return adaptedAchievements.filter((achievement) => {
      if (selectedCategory !== 'ALL' && achievement.category !== selectedCategory) {
        return false;
      }
      if (selectedRarity !== 'ALL' && achievement.rarity !== selectedRarity) {
        return false;
      }
      if (showUnlockedOnly && !achievement.userAchievement) {
        return false;
      }
      return true;
    });
  }, [adaptedAchievements, selectedCategory, selectedRarity, showUnlockedOnly]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={`stat-skeleton-${i}`} className="p-4 border border-custom">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </Card>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={`card-skeleton-${i}`} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {stats.unlocked}/{stats.total}
                </p>
                <p className="text-sm text-muted">Logros</p>
              </div>
              <div className="w-12 h-12 bg-accent-orange/20 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent-orange" />
              </div>
            </div>
            <Progress
              value={stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}
              className="mt-3 h-2"
            />
          </Card>

          <Card className="p-4 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString('es')}</p>
                <p className="text-sm text-muted">XP Total</p>
              </div>
              <div className="w-12 h-12 bg-accent-blue/20 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-accent-blue" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.byRarity.LEGENDARY}</p>
                <p className="text-sm text-muted">Legendarios</p>
              </div>
              <div className="w-12 h-12 bg-accent-orange/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-accent-orange" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total - stats.unlocked}</p>
                <p className="text-sm text-muted">Pendientes</p>
              </div>
              <div className="w-12 h-12 bg-tertiary rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <TabsList>
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex items-center gap-2">
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value as Difficulty | 'ALL')}
              className="bg-secondary border border-custom text-fg-primary rounded-lg px-3 py-2 text-sm outline-none"
              aria-label="Filtrar por rareza"
            >
              {rarities.map((r) => (
                <option key={r} value={r}>{RARITY_LABELS[r] || r}</option>
              ))}
            </select>

            <Button
              variant={showUnlockedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            >
              {showUnlockedOnly ? (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Desbloqueados
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Todos
                </>
              )}
            </Button>
          </div>
        </div>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            {filteredAchievements.length === 0 ? (
              <EmptyState
                title="Sin logros"
                description="Los logros se desbloquearán a medida que uses InkVerse"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}