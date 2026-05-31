import { Sparkles } from 'lucide-react';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/Layout/Container';
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

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--primary)]/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[var(--accent-purple)]/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/[0.02] blur-3xl" />
        </div>

        <Container className="relative text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[var(--primary)]/20 to-[var(--accent-purple)]/20 text-[var(--primary)] border border-[var(--primary)]/20 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Blog
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Blog de MangaAura
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
            Guías, tutoriales y novedades para creadores y lectores de manga.
          </p>
        </Container>
      </section>

      {/* Articles Grid */}
      <section className="pb-16 md:pb-20">
        <Container>
          {articles.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-secondary)]">
              <p>Próximamente: guías para crear tu primer manga, tutoriales de crowdfunding y más.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((a) => (
                <Link key={a.id} href={`/blog/${a.slug}`} className="group">
                  <article className="border border-[var(--border)] bg-[var(--surface)] rounded-xl overflow-hidden hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-1 transition-all duration-300">
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
                    <div className="p-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] mb-2">
                        {a.category}
                      </span>
                      <h2 className="text-lg font-bold mt-1 group-hover:text-[var(--primary)] transition-colors">{a.title}</h2>
                      <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">{a.excerpt}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
