import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Blog de MangaAura | Guías, tutoriales y novedades',
  description: 'Guías para crear manga, tutoriales de la plataforma, consejos de crowdfunding y novedades de la comunidad MangaAura. Aprende a publicar y monetizar tu manga.',
  openGraph: {
    title: 'Blog de MangaAura | Guías y tutoriales',
    description: 'Aprende a crear, publicar y monetizar tu manga con las guías y tutoriales de MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const articles = await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, slug: true, excerpt: true, category: true, coverUrl: true, createdAt: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-2">Blog de MangaAura</h1>
      <p className="text-lg text-fg-secondary mb-10">Guías, tutoriales y novedades para creadores y lectores de manga.</p>

      {articles.length === 0 ? (
        <div className="text-center py-20 text-fg-secondary">
          <p>Próximamente: guías para crear tu primer manga, tutoriales de crowdfunding y más.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link key={a.id} href={`/news/${a.slug}`} className="group">
              <article className="border border-border rounded-xl overflow-hidden hover:border-primary transition-colors">
                <div className="aspect-video bg-muted flex items-center justify-center text-fg-tertiary overflow-hidden">
                  {a.coverUrl ? (
                    <img src={a.coverUrl} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📖</span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs uppercase tracking-wider text-primary font-semibold">{a.category}</span>
                  <h2 className="text-lg font-bold mt-1 group-hover:text-primary transition-colors">{a.title}</h2>
                  <p className="text-sm text-fg-secondary mt-2 line-clamp-2">{a.excerpt}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
