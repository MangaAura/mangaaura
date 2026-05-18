'use client';

import { Flame, Trophy, BookOpen, Star } from 'lucide-react';
import { QuestPanel } from '@/components/Quest/QuestPanel';
import Link from 'next/link';

export function QuestsPageClient() {

  return (
    <div className="space-y-8">
      <QuestPanel />

      <div className="bg-secondary border border-custom rounded-xl p-6">
        <h2 className="font-bold flex items-center gap-2 mb-4">
          <Star size={18} className="text-accent-blue" />
          Más formas de ganar XP
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/achievements" className="flex items-center gap-3 p-3 rounded-xl bg-tertiary hover:bg-custom border border-custom transition-colors">
            <Trophy size={20} className="text-[var(--warning)]" />
            <div>
              <p className="font-semibold text-sm">Logros</p>
              <p className="text-xs text-muted">Desbloquea logros para ganar XP</p>
            </div>
          </Link>
          <Link href="/reading-history" className="flex items-center gap-3 p-3 rounded-xl bg-tertiary hover:bg-custom border border-custom transition-colors">
            <BookOpen size={20} className="text-accent-blue" />
            <div>
              <p className="font-semibold text-sm">Leer capítulos</p>
              <p className="text-xs text-muted">Cada capítulo leído da XP</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="bg-secondary border border-custom rounded-xl p-6">
        <h2 className="font-bold flex items-center gap-2 mb-2">
          <Flame size={18} className="text-[var(--accent-orange)]" />
          Rachas de lectura
        </h2>
        <p className="text-sm text-muted mb-4">
          Leé al menos un capítulo por día para mantener tu racha. Las rachas largas multiplican tu XP ganado.
        </p>
        <Link href="/profile" className="text-sm text-accent-blue hover:underline font-semibold">
          Ver mi racha actual →
        </Link>
      </div>
    </div>
  );
}
