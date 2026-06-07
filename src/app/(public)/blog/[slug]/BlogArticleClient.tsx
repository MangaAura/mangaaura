'use client';

import { ArrowLeft, Calendar, FileText, User } from 'lucide-react';
import Link from 'next/link';

import { ShareButton } from '@/components/Share/ShareButton';
import { useT } from '@/i18n';
import type { DisplayNewsItem } from '@/lib/news';

interface RelatedItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  titleEn?: string | null;
  excerptEn?: string | null;
  coverUrl: string | null;
  category: string;
  isFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface Props {
  article: DisplayNewsItem;
  relatedArticles?: RelatedItem[];
}

export function BlogArticleClient({ article, relatedArticles = [] }: Props) {
  const t = useT();
  return (
    <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('blog.backToBlog')}
      </Link>

      <article>
        {article.coverUrl && (
          <div className="aspect-video rounded-xl overflow-hidden mb-8 bg-[var(--surface-sunken)]">
            <img src={article.coverUrl} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
            {article.authorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {article.authorName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {article.date}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">{article.title}</h1>
          <p className="text-lg text-[var(--text-secondary)]">{article.description}</p>
        </header>

        {article.body && (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
        )}

        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              {t('blog.shareArticle')}
            </p>
            <div className="flex items-center gap-2">
              <ShareButton
                variant="outline"
                size="sm"
                title={article.title}
                text={article.description || `Lee "${article.title}" en MangaAura`}
              />
            </div>
          </div>
        </div>
      </article>

      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-8 border-t border-[var(--border)]">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--primary)]" />
            {t('blog.relatedArticles')}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedArticles.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="group border border-[var(--border)] bg-[var(--surface)] rounded-xl p-4 hover:border-[var(--primary)]/40 hover:shadow-sm transition-all"
              >
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] mb-2">
                  {r.category}
                </span>
                <h3 className="font-bold text-sm group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                  {r.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                  {r.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
