import { Metadata } from 'next';
import { detectLocale } from '@/i18n/server';
import { getT } from '@/i18n/getT';
import { Target } from 'lucide-react';
import { QuestsPageClient } from './QuestsPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.quests.title');
  const description = t('page.quests.description');

  return {
    title,
    description,
  };
}

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
