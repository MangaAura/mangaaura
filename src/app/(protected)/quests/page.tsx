import { Target } from 'lucide-react';
import type { Metadata } from 'next';

import { QuestsPageClient } from './QuestsPageClient';

export const metadata: Metadata = {
  title: 'Misiones | Inkverse',
  description: 'Completa misiones diarias y semanales para ganar XP y monedas',
};

export default function QuestsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Target className="text-[var(--primary)]" size={30} /> Misiones
        </h1>
        <p className="text-muted">Completa misiones diarias y semanales para ganar XP y monedas</p>
      </div>
      <QuestsPageClient />
    </div>
  );
}
