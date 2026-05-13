import { useState, useEffect } from 'react';

export function useUnreadNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/notifications/unread');
        if (res.ok) { const data = await res.json(); setUnreadCount(data.unread || 0); }
      } catch { /* ignore */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);
  return unreadCount;
}
