'use client';

import { type ReactNode } from 'react';

interface RepeatedCharProps {
  text: string;
  className?: string;
}

function processText(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (nextChar && char === nextChar) {
      result.push(<span key={i}>{char}</span>);
      result.push(<i key={`${i}-i`} style={{ fontStyle: 'italic' }}>{nextChar}</i>);
      i += 2;
      continue;
    }

    result.push(<span key={i}>{char}</span>);
    i += 1;
  }

  return result;
}

export function RepeatedChar({ text, className }: RepeatedCharProps) {
  return <span className={className}>{processText(text)}</span>;
}
