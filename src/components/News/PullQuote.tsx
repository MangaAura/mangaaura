'use client';

import { cn } from '@/lib/utils';

interface PullQuoteProps {
  text: string;
  source?: string;
  accentColor?: string;
}

export function PullQuote({ text, source, accentColor }: PullQuoteProps) {
  return (
    <figure
      className="my-12 sm:my-14 relative pl-6 sm:pl-8"
      style={{
        borderLeft: `3px solid ${accentColor || 'var(--primary)'}`,
      }}
    >
      <blockquote className={cn(
        'text-xl sm:text-2xl md:text-3xl font-semibold leading-snug italic',
      )}
      style={{ color: accentColor || 'var(--primary)' }}>
        {text}
      </blockquote>
      {source && (
        <figcaption className="mt-3 text-sm text-muted not-italic">
          &mdash; {source}
        </figcaption>
      )}
    </figure>
  );
}
