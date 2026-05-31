'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

import { extractApiError } from '@/lib/extract-api-error';

type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

interface UseFriendReturn {
  status: FriendStatus;
  isLoading: boolean;
  sendRequest: () => Promise<void>;
  acceptRequest: () => Promise<void>;
  rejectRequest: () => Promise<void>;
  removeFriend: () => Promise<void>;
  cancelRequest: () => Promise<void>;
}

export function useFriend(targetUserId: string): UseFriendReturn {
  const { data: session } = useSession();
  const [status, setStatus] = useState<FriendStatus>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !targetUserId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const checkStatus = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/friends/requests?direction=received`);
        if (res.ok) {
          const data = await res.json();
          const req = data.requests.find(
            (r: any) => r.sender.id === targetUserId
          );
          if (req) {
            setStatus('pending_received');
            setRequestId(req.id);
            setIsLoading(false);
            return;
          }
        }

        const res2 = await fetch(`/api/friends/requests?direction=sent`);
        if (res2.ok) {
          const data = await res2.json();
          const req = data.requests.find(
            (r: any) => r.receiver.id === targetUserId
          );
          if (req) {
            setStatus('pending_sent');
            setRequestId(req.id);
            setIsLoading(false);
            return;
          }
        }

        const res3 = await fetch(`/api/friends?limit=1`);
        if (res3.ok) {
          const data = await res3.json();
          const isFriend = data.friends.some((f: any) => f.id === targetUserId);
          if (isFriend) {
            setStatus('friends');
            setIsLoading(false);
            return;
          }
        }

        setStatus('none');
      } catch {
        setStatus('none');
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [session?.user?.id, targetUserId]);

  const sendRequest = useCallback(async () => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: targetUserId }),
      });
      if (!res.ok) {
        const { message } = await extractApiError(res);
        throw new Error(message);
      }
      const data = await res.json();
      setStatus(data.status === 'ACCEPTED' ? 'friends' : 'pending_sent');
      if (data.status === 'ACCEPTED') setRequestId(null);
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  }, [targetUserId]);

  const acceptRequest = useCallback(async () => {
    if (!requestId) return;
    try {
      const res = await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'ACCEPT' }),
      });
      if (!res.ok) {
        const { message } = await extractApiError(res);
        throw new Error(message);
      }
      setStatus('friends');
      setRequestId(null);
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  }, [requestId]);

  const rejectRequest = useCallback(async () => {
    if (!requestId) return;
    try {
      await fetch('/api/friends/request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'REJECT' }),
      });
      setStatus('none');
      setRequestId(null);
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  }, [requestId]);

  const removeFriend = useCallback(async () => {
    try {
      await fetch(`/api/friends/request?userId=${targetUserId}`, {
        method: 'DELETE',
      });
      setStatus('none');
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  }, [targetUserId]);

  const cancelRequest = useCallback(async () => {
    if (!requestId) return;
    try {
      await fetch(`/api/friends/request?requestId=${requestId}`, {
        method: 'DELETE',
      });
      setStatus('none');
      setRequestId(null);
    } catch (err) {
      console.error('Error cancelling request:', err);
    }
  }, [requestId]);

  return {
    status,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    cancelRequest,
  };
}
