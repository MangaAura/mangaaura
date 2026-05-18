'use client';

import { Repeat2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

interface RepostButtonProps {
  originalType: 'MANGA' | 'CHAPTER' | 'COMMENT';
  originalId: string;
  initialReposted?: boolean;
  size?: 'sm' | 'md';
}

export function RepostButton({ originalType, originalId, initialReposted = false, size = 'sm' }: RepostButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reposted, setReposted] = useState(initialReposted);
  const [loading, setLoading] = useState(false);

  const handleRepost = async () => {
    if (!session?.user?.id) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reposts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalType, originalId }),
      });
      if (res.ok) {
        const data = await res.json();
        setReposted(data.reposted);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const isSm = size === 'sm';

  return (
    <button
      onClick={handleRepost}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 ${
        isSm ? 'text-xs px-2.5 py-1.5' : 'text-sm px-3 py-2'
      } ${reposted ? 'bg-accent-green/10 text-accent-green border border-accent-green/30' : 'bg-tertiary hover:bg-custom text-muted border border-custom'}`}
      title={reposted ? 'Quitar repost' : 'Repostear'}
    >
      {loading ? <Loader2 size={isSm ? 12 : 14} className="animate-spin" /> : <Repeat2 size={isSm ? 12 : 14} />}
      {reposted ? 'Reposteado' : 'Repost'}
    </button>
  );
}
