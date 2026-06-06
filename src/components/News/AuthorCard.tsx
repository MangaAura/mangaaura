'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

interface AuthorCardProps {
  name: string;
  avatarUrl?: string | null;
  username?: string | null;
}

export function AuthorCard({ name, avatarUrl, username }: AuthorCardProps) {
  const content = (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <User size={20} className="text-[var(--primary)]" />
        )}
      </div>
      <div>
        <p className="text-xs text-muted font-medium">Escrito por</p>
        <p className="font-semibold text-fg-primary">{name}</p>
      </div>
    </div>
  );

  if (username) {
    return (
      <Link href={`/user/${username}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
