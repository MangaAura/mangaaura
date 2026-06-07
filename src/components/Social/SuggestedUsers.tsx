'use client';

import { Users, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { FollowButton } from './FollowButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useT } from '@/i18n';

interface SuggestedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export function SuggestedUsers() {
  const t = useT();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/suggested');
      if (!res.ok) throw new Error('Failed to load suggestions');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError(t('suggestedUsers.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--primary)]" />
            {t('suggestedUsers.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="w-20 h-8 rounded-lg" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || users.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          {t('suggestedUsers.title')}
        </CardTitle>
        <button
          onClick={fetchUsers}
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 cursor-pointer"
          aria-label={t('suggestedUsers.refresh')}
        >
          <RefreshCw className="w-3 h-3" />
          {t('suggestedUsers.refresh')}
        </button>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-sunken)]/50 transition-colors group"
          >
            <Link href={`/user/${user.username}`} className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--surface-sunken)]">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-semibold text-sm">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>
            <Link
              href={`/user/${user.username}`}
              className="flex-1 min-w-0 hover:underline"
            >
              <p className="text-sm font-medium truncate">
                {user.displayName || user.username}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                @{user.username}
              </p>
            </Link>
            <FollowButton
              targetId={user.id}
              targetType="USER"
              size="sm"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
