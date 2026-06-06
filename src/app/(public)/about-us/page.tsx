import { Metadata } from 'next';

import AboutClient from './AboutClient';
import { BreadcrumbStructuredData, WebPageStructuredData, OrganizationStructuredData, FAQPageStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.aboutUs.title');
  const description = t('page.aboutUs.description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    ...withHreflang('/about-us'),
  };
}

export default async function AboutPage(props: any) {
  const locale = await detectLocale();
  const t = getT(locale);

  const faqItems = [
    {
      question: t('faqPage.faq1Q'),
      answer: t('faqPage.faq1A')
    },
    {
      question: t('faqPage.faq2Q'),
      answer: t('faqPage.faq2A')
    },
    {
      question: t('faqPage.faq3Q'),
      answer: t('faqPage.faq3A')
    },
    {
      question: t('faqPage.faq4Q'),
      answer: t('faqPage.faq4A')
    },
  ];

  const pageTitle = t('page.aboutUs.title');

  return (
    <>
      <WebPageStructuredData
        name={`${pageTitle} | MangaAura`}
        description={t('page.aboutUs.description')}
        url="/about-us"
        datePublished="2024-01-01"
        dateModified="2025-05-28"
        breadcrumbs={[
          { name: t('nav.home'), item: '/' },
          { name: pageTitle, item: '/about-us' },
        ]}
      />
      <OrganizationStructuredData />
      <FAQPageStructuredData
        items={faqItems}
      />
      <BreadcrumbStructuredData
        items={[
          { name: t('nav.home'), item: '/' },
          { name: pageTitle, item: '/about-us' },
        ]}
      />
      <AboutClient {...props} />
    </>
  );
}
