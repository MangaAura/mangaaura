'use client';

import { Suspense } from 'react';
import AuthErrorPage from './AuthErrorPage';

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-24 h-24 rounded-full bg-slate-700 mx-auto mb-6"></div>
          <div className="h-8 bg-slate-700 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-64 mx-auto"></div>
        </div>
      </div>
    }>
      <AuthErrorPage />
    </Suspense>
  );
}
