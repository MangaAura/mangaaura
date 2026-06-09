import Script from 'next/script';

interface MangaStructuredDataProps {
  title: string;
  description: string;
  author: string;
  coverUrl?: string;
  slug: string;
  rating?: number;
  tags?: string[];
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

interface FAQPageStructuredDataProps {
  items: Array<{
    question: string;
    answer: string;
  }>;
}

interface HowToStructuredDataProps {
  name: string;
  description: string;
  steps: Array<{
    name: string;
    text: string;
    url?: string;
    image?: string;
  }>;
  totalTime?: string;
  estimatedCost?: string;
}

interface ArticleStructuredDataProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  datePublished: string;
  dateModified?: string;
  publisherName?: string;
  publisherLogo?: string;
}

export function MangaStructuredData({
  title,
  description,
  author,
  coverUrl,
  slug,
  rating,
  tags,
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
    url: `https://mangaaura.es/manga/${slug}`,
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
      url: `https://mangaaura.es/manga/${mangaSlug}`,
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    image: coverUrl,
    url: `https://mangaaura.es/${mangaSlug}-${chapterNumber}`,
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

export function FAQPageStructuredData({ items }: FAQPageStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function HowToStructuredData({
  name,
  description,
  steps,
  totalTime,
  estimatedCost,
}: HowToStructuredDataProps) {
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && { image: step.image }),
    })),
    ...(totalTime && { totalTime }),
    ...(estimatedCost && { estimatedCost: { '@type': 'MonetaryAmount', value: estimatedCost, currency: 'EUR' } }),
  };

  return (
    <Script
      id="howto-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function ArticleStructuredData({
  title,
  description,
  url,
  imageUrl,
  authorName,
  datePublished,
  dateModified,
  publisherName = 'MangaAura',
  publisherLogo = 'https://mangaaura.es/icons/icon-512x512.png',
}: ArticleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(imageUrl && { image: imageUrl }),
    author: {
      '@type': 'Person',
      name: authorName,
    },
    datePublished,
    ...(dateModified && { dateModified }),
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      logo: {
        '@type': 'ImageObject',
        url: publisherLogo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <Script
      id="article-structured-data"
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
      item: `https://mangaaura.es${item.item}`,
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
    name: 'MangaAura',
    url: 'https://mangaaura.es',
    description: 'Lee, descubre y crea mangas. La mejor plataforma para creadores y lectores de manga.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://mangaaura.es/explore?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    sameAs: [
      'https://x.com/MangaAura',
      'https://instagram.com/mangaauraoficial',
      'https://tiktok.com/@mangaauraoficial',
      'https://youtube.com/@MangaAuraOficial',
      'https://discord.gg/56wKdQ2qGt',
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

interface WebPageStructuredDataProps {
  name: string;
  description: string;
  url: string;
  lastReviewed?: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumbs?: Array<{ name: string; item: string }>;
}

export function WebPageStructuredData({
  name,
  description,
  url,
  lastReviewed,
  datePublished,
  dateModified,
  breadcrumbs,
}: WebPageStructuredDataProps) {
  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name,
      description,
      url: `https://mangaaura.es${url}`,
      ...(lastReviewed && { lastReviewed }),
      ...(datePublished && { datePublished }),
      ...(dateModified && { dateModified }),
      ...(breadcrumbs && breadcrumbs.length > 0
        ? {
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbs.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: `https://mangaaura.es${item.item}`,
              })),
            },
          }
        : {}),
    },
  ];

  return (
    <Script
      id="webpage-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph[0]) }}
    />
  );
}

export function SearchResultsPageStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'Explorar Manga | MangaAura',
    description: 'Descubre y explora mangas por género, popularidad, últimas actualizaciones y calificaciones.',
    url: 'https://mangaaura.es/explore',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Manga disponibles',
    },
    significantLink: [
      'https://mangaaura.es/rankings',
      'https://mangaaura.es/discover',
    ],
  };

  return (
    <Script
      id="search-results-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface NewsArticleStructuredDataProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  authorName: string;
  datePublished: string;
  dateModified?: string;
  category?: string;
  keywords?: string[];
  wordCount?: number;
}

export function NewsArticleStructuredData({
  title,
  description,
  url,
  imageUrl,
  authorName,
  datePublished,
  dateModified,
  category,
  keywords,
  wordCount,
}: NewsArticleStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    url,
    ...(imageUrl && { image: imageUrl }),
    author: {
      '@type': 'Person',
      name: authorName,
    },
    datePublished,
    ...(dateModified && { dateModified }),
    ...(category && { articleSection: category }),
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    ...(wordCount !== undefined && { wordCount }),
    publisher: {
      '@type': 'Organization',
      name: 'MangaAura',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mangaaura.es/icons/icon-512x512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <Script
      id="news-article-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface DiscussionForumPostingStructuredDataProps {
  title: string;
  description: string;
  url: string;
  authorName: string;
  datePublished: string;
  articleBody?: string;
  imageUrl?: string;
}

export function DiscussionForumPostingStructuredData({
  title,
  description,
  url,
  authorName,
  datePublished,
  articleBody,
  imageUrl,
}: DiscussionForumPostingStructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: title,
    description,
    url: `https://mangaaura.es${url}`,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    datePublished,
    ...(articleBody && { articleBody }),
    ...(imageUrl && { image: imageUrl }),
    publisher: {
      '@type': 'Organization',
      name: 'MangaAura',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mangaaura.es/icons/icon-512x512.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://mangaaura.es${url}`,
    },
  };

  return (
    <Script
      id="discussion-forum-posting-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function SoftwareApplicationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MangaAura',
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web (PWA), Android, iOS',
    description: 'La plataforma de manga con IA para leer, crear y crowdfundear capítulos. Alternativa a Webtoon, Manga Plus, Tapas, Shonen Jump, MangaDex e INKR.',
    image: 'https://mangaaura.es/og-image.webp',
    url: 'https://mangaaura.es',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Gratis para lectores. Los creadores ganan mediante crowdfunding con Aura.',
      availability: 'https://schema.org/InStock',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'ES',
        merchantReturnDays: 0,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'ES',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY',
          },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      bestRating: '5',
      ratingCount: '1500',
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4.5',
        bestRating: '5',
      },
      author: {
        '@type': 'Organization',
        name: 'MangaAura',
      },
      reviewBody: 'La plataforma definitiva para leer, crear y crowdfundear manga con herramientas de IA.',
    },
    featureList: [
      'Lectura de manga gratis',
      'Creación de manga con herramientas IA',
      'Crowdfunding de capítulos con Aura',
      'Gamificación con XP, niveles y logros',
      'Comunidad con clanes y foros',
      'Lectura offline con PWA',
      'Traducción automática con IA',
      'Generación de arte con IA para creadores',
    ],
    screenshot: 'https://mangaaura.es/og-image.webp',
    sameAs: [
      'https://x.com/MangaAura',
      'https://instagram.com/mangaauraoficial',
      'https://tiktok.com/@mangaauraoficial',
      'https://youtube.com/@MangaAuraOficial',
      'https://discord.gg/56wKdQ2qGt',
    ],
  };

  return (
    <Script
      id="software-application-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MangaAura',
    url: 'https://mangaaura.es',
    logo: 'https://mangaaura.es/icons/icon-512x512.png',
    description: 'Plataforma de manga para creadores y lectores',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Support',
      email: 'support@mangaaura.es',
    },
    sameAs: [
      'https://x.com/MangaAura',
      'https://instagram.com/mangaauraoficial',
      'https://tiktok.com/@mangaauraoficial',
      'https://youtube.com/@MangaAuraOficial',
      'https://discord.gg/56wKdQ2qGt',
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
