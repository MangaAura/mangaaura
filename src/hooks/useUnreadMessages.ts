import { useState, useEffect } from 'react';

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (res.ok && mounted) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch { /* ignore */ }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return unreadCount;
}
