'use client';

import { Trophy, Award, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface UserAchievement {
  id: string;
  achievement: {
    id: string;
    name: string;
    description: string;
    iconUrl: string | null;
    category: string;
    difficulty: string;
  };
  unlockedAt: Date;
}

interface AchievementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievements: UserAchievement[];
}

const difficultyColors: Record<string, string> = {
  EASY: 'from-slate-400 to-slate-300',
  MEDIUM: 'from-emerald-500 to-teal-400',
  HARD: 'from-violet-500 to-purple-400',
  LEGENDARY: 'from-amber-500 to-orange-400',
};

const difficultyGlow: Record<string, string> = {
  EASY: 'shadow-[0_0_8px_rgba(148,163,184,0.2)]',
  MEDIUM: 'shadow-[0_0_8px_rgba(52,211,153,0.3)]',
  HARD: 'shadow-[0_0_8px_rgba(139,92,246,0.3)]',
  LEGENDARY: 'shadow-[0_0_12px_rgba(245,158,11,0.4)]',
};

export function AchievementsModal({ open, onOpenChange, achievements }: AchievementsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--warning)]" />
            Logros ({achievements.length})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {achievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">No has desbloqueado logros todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {achievements.map((ua) => {
                const diff = ua.achievement.difficulty;
                return (
                  <div
                    key={ua.id}
                    className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${difficultyColors[diff] || 'from-[var(--primary)] to-[var(--accent-purple)]'} flex items-center justify-center flex-shrink-0 ${difficultyGlow[diff] || ''}`}>
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {ua.achievement.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        {ua.achievement.description}
                      </p>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-[var(--warning)] flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 -mx-6 px-6 border-t border-[var(--border)]">
          <Link
            href="/achievements"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-1 py-2 text-sm text-[var(--primary)] hover:underline font-medium"
          >
            Ver todos los logros
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
