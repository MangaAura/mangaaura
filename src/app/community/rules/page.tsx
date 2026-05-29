'use client';

import { ShieldCheck } from 'lucide-react';

import { useLocale } from '@/i18n';
import es from '@/i18n/locales/es.json';
import en from '@/i18n/locales/en.json';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reglas de la Comunidad | MangaAura',
  description: 'Conoce las reglas y normas de convivencia de la comunidad MangaAura.',
  openGraph: {
    title: 'Reglas de la Comunidad | MangaAura',
    description: 'Conoce las reglas y normas de convivencia de la comunidad MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reglas de la Comunidad | MangaAura',
    description: 'Reglas de la comunidad MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/community/rules' },
};

export default function CommunityRulesPage() {
  const { locale } = useLocale();
  const dict = locale === 'en' ? en : es;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-24 pb-10">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <ShieldCheck className="text-[var(--primary)]" size={32} aria-hidden="true" />
          <h1 className="text-3xl font-extrabold tracking-tight">
            {dict.community.rulesTitle}
          </h1>
        </div>
        <p className="text-[var(--text-secondary)] text-lg">
          {dict.community.rulesDesc}
        </p>
      </header>

      <div className="space-y-4">
        {dict.community.rulesList.map((rule: string, idx: number) => (
          <div
            key={idx}
            className="flex items-start gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5"
          >
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-sm font-bold">
              {idx + 1}
            </span>
            <p className="text-[var(--text-primary)] leading-relaxed pt-0.5">
              {rule}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
