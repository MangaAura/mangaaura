'use client';

import { Suspense } from 'react';

import { NoIndex } from '@/components/SEO/NoIndex';
import AuthErrorPage from './AuthErrorPage';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error de Autenticación | MangaAura',
  description: 'Ocurrió un error durante la autenticación en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Error de Autenticación | MangaAura',
    description: 'Ocurrió un error durante la autenticación en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Error de Autenticación | MangaAura',
    description: 'Error de autenticación en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/auth/error' },
};

export default function AuthError() {
  return (
    <>
      <NoIndex />
      <Suspense fallback={
<div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--border)] mx-auto mb-6"></div>
        <div className="h-8 bg-[var(--border)] rounded w-48 mx-auto mb-4"></div>
        <div className="h-4 bg-[var(--border)] rounded w-64 mx-auto"></div>
        </div>
      </div>
    }>
      <AuthErrorPage />
    </Suspense>
    </>
  );
}
