import { useState, useEffect, useRef } from 'react';

import { useSocket } from '@/hooks/useSocket';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isConnected, on } = useSocket({ autoConnect: true });
  const hasListenersRef = useRef(false);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (res.ok) { const data = await res.json(); setUnreadCount(data.count || 0); }
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    if (!isConnected || !on || hasListenersRef.current) return;
    hasListenersRef.current = true;

    const cleanup = on('dm:unread-count', (data: { count: number }) => {
      setUnreadCount(data.count);
    });

    return () => {
      cleanup?.();
      hasListenersRef.current = false;
    };
  }, [isConnected, on]);

  return unreadCount;
}
