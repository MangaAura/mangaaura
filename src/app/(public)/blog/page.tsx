import { BookOpen } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { BreadcrumbStructuredData } from '@/components/SEO/StructuredData';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { prisma } from '@/lib/prisma';
import { withHreflang } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.blog.title');
  const description = t('page.blog.description');

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: t('page.blogOg.title'),
      description: t('page.blogOg.description'),
      type: 'website',
      images: ['/og-image.png'],
    },
    ...withHreflang('/blog'),
  };
}

export default async function BlogPage() {
  const locale = await detectLocale();
  const t = getT(locale);

  const articles = await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, excerpt: true, category: true, coverUrl: true, createdAt: true },
  });

  return (
    <>
      <BreadcrumbStructuredData
        items={[
          { name: 'Inicio', item: '/' },
          { name: 'Blog', item: '/blog' },
        ]}
      />

      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none" />

        <Container className="relative z-10 py-12">
          <PageHeader
            title={t('page.blog.heroTitle')}
            description={t('page.blog.heroSubtitle')}
            icon={<BookOpen className="w-8 h-8" />}
          />
        </Container>

        {/* Articles Grid */}
        <section className="relative pb-16 md:pb-20">
          <Container>
            {articles.length === 0 ? (
              <div className="text-center py-20 text-[var(--text-secondary)]">
                <p>{t('page.blog.empty')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((a) => (
                  <Link key={a.id} href={`/blog/${a.slug}`} className="group">
                    <article className="border border-[var(--border)] bg-[var(--surface)] rounded-xl overflow-hidden hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-video bg-[var(--surface-sunken)] flex items-center justify-center text-[var(--text-tertiary)] overflow-hidden">
                        {a.coverUrl ? (
                          <Image
                            src={a.coverUrl}
                            alt={a.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <span className="text-4xl">📖</span>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] mb-2">
                          {a.category}
                        </span>
                        <h2 className="text-lg font-bold mt-1 group-hover:text-[var(--primary)] transition-colors">{a.title}</h2>
                        <div className="flex-1" />
                        <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{a.excerpt}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </section>
      </div>
    </>
  );
}
