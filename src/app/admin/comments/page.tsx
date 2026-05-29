import type { Metadata } from 'next';
import CommentModerationClient from './CommentModerationClient';

export const metadata: Metadata = {
  title: 'Administrar Comentarios | MangaAura',
  description: 'Modera y gestiona los comentarios en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Administrar Comentarios | MangaAura',
    description: 'Modera y gestiona los comentarios en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Administrar Comentarios | MangaAura',
    description: 'Modera los comentarios en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/comments' },
};

export default function CommentModerationPage(props: any) {
  return <CommentModerationClient {...props} />;
}
