import type { Metadata } from 'next';
import MyMangaClient from './MyMangaClient';

export const metadata: Metadata = {
  title: 'Mis Mangas | MangaAura',
  description: 'Gestiona tus series de manga publicadas en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Mis Mangas | MangaAura',
    description: 'Gestiona tus series de manga publicadas en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mis Mangas | MangaAura',
    description: 'Gestiona tus mangas en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/creator/manga' },
};

export default function MyMangaPage(props: any) {
  return <MyMangaClient {...props} />;
}
