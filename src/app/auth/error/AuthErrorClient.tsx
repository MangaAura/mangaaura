'use client';

import { Suspense } from 'react';

import { NoIndex } from '@/components/SEO/NoIndex';
import AuthErrorPage from './AuthErrorPage';

export default function AuthErrorClient() {
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
