import { HelpCircle, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { FAQPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes - MangaAura',
  description: 'Encuentra respuestas a las preguntas más comunes sobre MangaAura: lectura, creación, monetización, Aura y más.',
  openGraph: {
    title: 'Preguntas Frecuentes - MangaAura',
    description: 'Encuentra respuestas a las preguntas más comunes sobre MangaAura.',
    type: 'website',
    siteName: 'MangaAura',
    locale: 'es_ES',
  },
};

const faqItems = [
  { qKey: 'faq1Q', aKey: 'faq1A' },
  { qKey: 'faq2Q', aKey: 'faq2A' },
  { qKey: 'faq3Q', aKey: 'faq3A' },
  { qKey: 'faq4Q', aKey: 'faq4A' },
  { qKey: 'faq5Q', aKey: 'faq5A' },
  { qKey: 'faq6Q', aKey: 'faq6A' },
  { qKey: 'faq7Q', aKey: 'faq7A' },
  { qKey: 'faq8Q', aKey: 'faq8A' },
] as const;

export default async function FAQPage() {
  const locale = await detectLocale();
  const t = getT(locale);

  const structuredItems = faqItems.map(({ qKey, aKey }) => ({
    question: t(`faqPage.${qKey}`),
    answer: t(`faqPage.${aKey}`),
  }));

  return (
    <>
      <FAQPageStructuredData items={structuredItems} />
      <Container className="py-12">
        <PageHeader
          title={t('faqPage.title')}
          description={t('faqPage.description')}
          icon={<HelpCircle className="w-8 h-8" />}
        />

        <div className="max-w-3xl mx-auto">
          <div className="space-y-3">
            {faqItems.map(({ qKey, aKey }, i) => (
              <details
                key={i}
                className="group border border-[var(--border)] rounded-xl overflow-hidden transition-colors hover:border-[var(--primary)]/30"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--surface-elevated)]/50 transition-colors font-medium text-[var(--text-primary)]">
                  <span>{t(`faqPage.${qKey}`)}</span>
                  <ExternalLink className="w-4 h-4 text-[var(--text-tertiary)] transition-transform group-open:rotate-90 flex-shrink-0" />
                </summary>
                <div className="px-5 pb-4 pt-2">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {t(`faqPage.${aKey}`)}
                  </p>
                </div>
              </details>
            ))}
          </div>

          {/* Still have questions CTA */}
          <div className="mt-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {t('faqPage.stillHaveQuestions')}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {t('help.notFoundDesc')}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t('faqPage.contactSupport')}
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
