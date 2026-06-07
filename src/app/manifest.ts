import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MangaAura',
    short_name: 'MangaAura',
    description: 'Plataforma de lectura y creación de manga con IA, gamificación y crowdfunding.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'es',
    categories: ['entertainment', 'books', 'comics'],
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home.webp',
        sizes: '1280x720',
        type: 'image/webp',
        form_factor: 'wide',
        label: 'Página principal de MangaAura',
      },
      {
        src: '/screenshots/mobile.webp',
        sizes: '360x640',
        type: 'image/webp',
        form_factor: 'narrow',
        label: 'Explorar manga en MangaAura',
      },
    ],
  };
}
