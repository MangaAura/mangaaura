import Script from 'next/script';

interface MangaStructuredDataProps {
  title: string;
  description: string;
  author: string;
  coverUrl?: string;
  slug: string;
  rating?: number;
  tags?: string[];
  status: string;
  totalChapters: number;
}

interface ChapterStructuredDataProps {
  title: string;
  chapterNumber: number;
  mangaTitle: string;
  mangaSlug: string;
  author: string;
  coverUrl?: string;
  publishedAt: string;
  pageCount: number;
}

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    item: string;
  }>;
}

export function MangaStructuredData({
  title,
  description,
  author,
  coverUrl,
  slug,
  rating,
  tags,
  status,
  totalChapters,
}: MangaStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    description,
    author: {
      '@type': 'Person',
      name: author,
    },
    image: coverUrl,
    url: `https://inkverse.app/manga/${slug}`,
    bookFormat: 'GraphicNovel',
    genre: tags?.join(', ') || 'Manga',
    totalChapters,
    inLanguage: 'es',
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <Script
      id="manga-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ChapterStructuredData({
  title,
  chapterNumber,
  mangaTitle,
  mangaSlug,
  author,
  coverUrl,
  publishedAt,
  pageCount,
}: ChapterStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Chapter',
    name: `${mangaTitle} - Capítulo ${chapterNumber}: ${title || ''}`,
    isPartOf: {
      '@type': 'Book',
      name: mangaTitle,
      url: `https://inkverse.app/manga/${mangaSlug}`,
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    image: coverUrl,
    url: `https://inkverse.app/manga/${mangaSlug}/chapter/${chapterNumber}`,
    datePublished: publishedAt,
    pageStart: 1,
    pageEnd: pageCount,
    inLanguage: 'es',
  };

  return (
    <Script
      id="chapter-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://inkverse.app${item.item}`,
    })),
  };

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function WebsiteStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'InkVerse',
    url: 'https://inkverse.app',
    description: 'Lee, descubre y crea mangas. La mejor plataforma para creadores y lectores de manga.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://inkverse.app/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    sameAs: [
      'https://twitter.com/inkverse',
      'https://discord.gg/inkverse',
      'https://github.com/inkverse',
    ],
  };

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'InkVerse',
    url: 'https://inkverse.app',
    logo: 'https://inkverse.app/icons/icon-512x512.png',
    description: 'Plataforma de manga para creadores y lectores',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Support',
      email: 'support@inkverse.app',
    },
    sameAs: [
      'https://twitter.com/inkverse',
      'https://discord.gg/inkverse',
    ],
  };

  return (
    <Script
      id="organization-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
