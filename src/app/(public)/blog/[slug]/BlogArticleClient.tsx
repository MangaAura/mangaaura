'use client';

import { ArrowLeft, Calendar, User } from 'lucide-react';
import Link from 'next/link';

import { useT } from '@/i18n';
import type { DisplayNewsItem } from '@/lib/news';

interface Props {
  article: DisplayNewsItem;
}

export function BlogArticleClient({ article }: Props) {
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
      </article>
    </main>
  );
}
