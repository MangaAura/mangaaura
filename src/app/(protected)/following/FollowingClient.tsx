'use client';

import { UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useT } from '@/i18n';

interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  level: number;
  avatarUrl: string | null;
}

export interface FollowRelation {
  id: string;
  following: UserSummary;
  follower: UserSummary;
}

export function FollowingClient({ following, followers }: { following: FollowRelation[]; followers: FollowRelation[] }) {
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const t = useT();
  const items = tab === 'following' ? following : followers;
  const userKey = tab === 'following' ? 'following' : 'follower';

  return (
    <div className="max-w-2xl mx-auto px-4 pt-20 pb-10">
      <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 mb-6">
        <Users className="text-[var(--primary)]" size={30} /> {t('following.title')}
      </h1>

      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <button onClick={() => setTab('following')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'following' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
          {t('following.following')} ({following.length})
        </button>
        <button onClick={() => setTab('followers')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'followers' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
          {t('following.followers')} ({followers.length})
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-center text-[var(--text-muted)] py-12">
            {tab === 'following' ? t('following.emptyFollowing') : t('following.emptyFollowers')}
          </p>
        )}
        {items.map((item: FollowRelation) => {
          const user = item[userKey];
          return (
            <Link key={item.id} href={`/user/${user.username}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--surface)] transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center text-white text-sm font-bold">
                {user.displayName?.[0] || user.username[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{user.displayName || user.username}</p>
                <p className="text-xs text-[var(--text-muted)]">@{user.username} · Nv. {user.level}</p>
              </div>
              <UserPlus className="w-4 h-4 text-[var(--text-muted)]" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
