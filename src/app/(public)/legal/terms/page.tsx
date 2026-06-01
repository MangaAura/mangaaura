import { FileText, Check } from 'lucide-react';
import type { Metadata } from 'next';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('legal.terms.title');
  const description = t('legal.terms.description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'MangaAura',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    ...withHreflang('/legal/terms'),
  };
}

export default async function TermsPage() {
  const locale = await detectLocale();
  const t = getT(locale);
  const lastUpdated = '29 de abril de 2026';

  const sections = [
    { title: t('legal.terms.section1Title'), content: t('legal.terms.section1Content') },
    { title: t('legal.terms.section2Title'), content: t('legal.terms.section2Content') },
    { title: t('legal.terms.section3Title'), content: t('legal.terms.section3Content') },
    { title: t('legal.terms.section4Title'), content: t('legal.terms.section4Content') },
    { title: t('legal.terms.section5Title'), content: t('legal.terms.section5Content') },
    { title: t('legal.terms.section6Title'), content: t('legal.terms.section6Content') },
    { title: t('legal.terms.section7Title'), content: t('legal.terms.section7Content') },
    { title: t('legal.terms.section8Title'), content: t('legal.terms.section8Content') },
    { title: t('legal.terms.section9Title'), content: t('legal.terms.section9Content') },
    { title: t('legal.terms.section10Title'), content: t('legal.terms.section10Content') }
  ];

  return (
    <Container className="py-12">
      <PageHeader
        title={t('legal.terms.title')}
        description={`${t('legal.dmca.lastUpdated')}: ${lastUpdated}`}
        icon={<FileText className="w-8 h-8" />}
      />

    <div className="max-w-3xl mx-auto">
      <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            {t('legal.terms.intro')}
          </p>

          <div className="space-y-8">
            {sections.map((section, _index) => (
              <section key={section.title} className="border-b border-custom pb-6 last:border-0">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5 text-[var(--success)]" aria-hidden="true" />
                  {section.title}
                </h2>
                <div className="text-[var(--text-secondary)] whitespace-pre-line pl-7">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

            <div className="mt-8 p-4 bg-accent-blue/10 border border-accent-blue/30 rounded-xl">
              <p className="text-sm text-accent-blue font-medium">
                {t('legal.terms.confirmation')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
