'use client';

import { Users, UserPlus, Heart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Avatar, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

interface UserSummary {
  id: string;
  username: string;
  displayName: string | null;
  level: number;
  avatarUrl: string | null;
}

interface FollowItem {
  id: string;
  following: UserSummary;
  follower: UserSummary;
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  following: FollowItem[];
  followers: FollowItem[];
}

export function FollowersModal({ open, onOpenChange, following, followers }: FollowersModalProps) {
  const [tab, setTab] = useState<'following' | 'followers'>('following');

  const items = tab === 'following' ? following : followers;
  const userKey = tab === 'following' ? 'following' : 'follower';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--primary)]" />
            {tab === 'following' ? 'Siguiendo' : 'Seguidores'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b border-[var(--border)] pb-2">
          <button
            onClick={() => setTab('following')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'following'
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Heart className="w-4 h-4" />
            Siguiendo ({following.length})
          </button>
          <button
            onClick={() => setTab('followers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'followers'
                ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Seguidores ({followers.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                {tab === 'following'
                  ? 'No sigues a nadie todavía'
                  : 'No tienes seguidores todavía'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => {
                const user = item[userKey];
                return (
                  <Link
                    key={item.id}
                    href={`/user/${user.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors group"
                  >
                    <Avatar className="w-10 h-10 ring-1 ring-[var(--border)]">
                      <AvatarImage src={user.avatarUrl || undefined} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        @{user.username}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Nv.{user.level}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
