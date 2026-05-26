'use client';

import { useEffect } from 'react';

/**
 * Client component that injects a <meta name="robots" content="noindex" /> tag
 * into the document head. Use on pages that should not be indexed by search
 * engines but cannot export static metadata (e.g., client-only error/not-found
 * components).
 *
 * Cleans up the meta tag on unmount.
 */
export function NoIndex() {
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    if (existing) {
      (existing as HTMLMetaElement).content = 'noindex';
      return;
    }

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);

    return () => {
      meta.remove();
    };
  }, []);

  return null;
}
