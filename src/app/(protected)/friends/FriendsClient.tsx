'use client';

import {
  UserCheck,
  Loader2,
  Check,
  X,
  Users,
  UserX,
  Mail,
  MailOpen,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useT } from '@/i18n';

interface FriendUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

interface FriendRequest {
  id: string;
  sender: FriendUser;
  receiver: FriendUser;
  status: string;
  createdAt: string;
}

type Tab = 'friends' | 'received' | 'sent';

function UserCard({
  user,
  actions,
}: {
  user: FriendUser;
  actions: React.ReactNode;
}) {
  const displayName = user.displayName || user.username || 'Unknown';
  return (
    <Card className="flex items-center justify-between p-4 hover:border-[var(--primary)]/30 transition-all">
      <Link href={`/user/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex-shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-inverse)] text-sm font-bold">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {displayName}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] truncate">
            @{user.username}
          </p>
        </div>
      </Link>
      <div className="flex-shrink-0 ml-2">
        {actions}
      </div>
    </Card>
  );
}

export function FriendsClient() {
  const t = useT();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        fetch('/api/friends?limit=100'),
        fetch('/api/friends/requests?direction=received'),
        fetch('/api/friends/requests?direction=sent'),
      ]);

      if (friendsRes.ok) {
        const data = await friendsRes.json();
        setFriends(data.friends || []);
      }

      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setReceivedRequests(data.requests || []);
      }

      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentRequests(data.requests || []);
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = useCallback(async (requestId: string) => {
    setResponding(requestId);
    try {
      await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'ACCEPT' }),
      });
      await fetchData();
    } catch {
      // silent
    } finally {
      setResponding(null);
    }
  }, [fetchData]);

  const handleReject = useCallback(async (requestId: string) => {
    setResponding(requestId);
    try {
      await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'REJECT' }),
      });
      await fetchData();
    } catch {
      // silent
    } finally {
      setResponding(null);
    }
  }, [fetchData]);

  const handleCancel = useCallback(async (requestId: string) => {
    setResponding(requestId);
    try {
      await fetch(`/api/friends/request?requestId=${requestId}`, {
        method: 'DELETE',
      });
      await fetchData();
    } catch {
      // silent
    } finally {
      setResponding(null);
    }
  }, [fetchData]);

  const handleRemoveFriend = useCallback(async (userId: string) => {
    setResponding(userId);
    try {
      await fetch(`/api/friends/request?userId=${userId}`, {
        method: 'DELETE',
      });
      await fetchData();
    } catch {
      // silent
    } finally {
      setResponding(null);
    }
  }, [fetchData]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'friends', label: t('friends.tabFriends'), icon: <Users className="w-4 h-4" />, count: friends.length },
    { key: 'received', label: t('friends.tabReceived'), icon: <MailOpen className="w-4 h-4" />, count: receivedRequests.length },
    { key: 'sent', label: t('friends.tabSent'), icon: <Mail className="w-4 h-4" />, count: sentRequests.length },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Users className="text-[var(--primary)]" size={30} />
          {t('friends.title')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          {t('friends.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[var(--surface-elevated)] rounded-xl p-1 border border-[var(--border)] shadow-sm mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[var(--surface)] shadow-sm text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${
                activeTab === tab.key
                  ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <EmptyState
          title={t('common.error')}
          description={error}
          icon={<Users className="w-12 h-12 text-[var(--text-tertiary)]" />}
        />
      )}

      {/* Friends Tab */}
      {!loading && !error && activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <EmptyState
              title={t('friends.noFriends')}
              description={t('friends.noFriendsDesc')}
              icon={<UserCheck className="w-12 h-12 text-[var(--text-tertiary)]" />}
              action={{
                label: t('friends.discoverUsers'),
                href: '/social',
              }}
            />
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <UserCard
                  key={friend.id}
                  user={friend}
                  actions={                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={responding === friend.id}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title={t('friend.removeFriend')}
                        aria-label={t('friend.removeFriend')}
                      >
                        {responding === friend.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <UserX className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Received Requests Tab */}
      {!loading && !error && activeTab === 'received' && (
        <div className="space-y-3">
          {receivedRequests.length === 0 ? (
            <EmptyState
              title={t('friends.noRequests')}
              description={t('friends.noRequestsDesc')}
              icon={<MailOpen className="w-12 h-12 text-[var(--text-tertiary)]" />}
            />
          ) : (
            <div className="space-y-2">
              {receivedRequests.map((req) => (
                <UserCard
                  key={req.id}
                  user={req.sender}
                  actions={
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={responding === req.id}
                        className="p-2 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title={t('friend.accept')}
                        aria-label={t('friend.accept')}
                      >
                        {responding === req.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={responding === req.id}
                        className="p-2 text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        title={t('friend.reject')}
                        aria-label={t('friend.reject')}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {!loading && !error && activeTab === 'sent' && (
        <div className="space-y-3">
          {sentRequests.length === 0 ? (
            <EmptyState
              title={t('friends.noSentRequests')}
              description={t('friends.noSentRequestsDesc')}
              icon={<Mail className="w-12 h-12 text-[var(--text-tertiary)]" />}
            />
          ) : (
            <div className="space-y-2">
              {sentRequests.map((req) => (
                <UserCard
                  key={req.id}
                  user={req.receiver}
                  actions={
                    <button
                      onClick={() => handleCancel(req.id)}
                      disabled={responding === req.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors disabled:opacity-50 cursor-pointer"
                      title={t('friend.cancelRequest')}
                    >
                      {responding === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {t('friend.cancelRequest')}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
