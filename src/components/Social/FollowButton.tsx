'use client';

import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useOptimistic, useTransition } from 'react';

import { toggleFollow } from '@/app/social/actions';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';



interface FollowButtonProps {
  targetId: string;
  targetType: 'USER' | 'MANGA';
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'default' | 'lg';
}

export function FollowButton({
  targetId,
  targetType,
  initialIsFollowing = false,
  onFollowChange,
  size = 'default',
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFollowing, addOptimistic] = useOptimistic(
    initialIsFollowing,
    (state) => !state,
  );
  const { toast } = useToast();
  const pathname = usePathname();

  const handleToggleFollow = () => {
    startTransition(async () => {
      addOptimistic(undefined);
      try {
        const result = await toggleFollow(targetId, targetType, pathname);
        onFollowChange?.(result.isFollowing);
        toast({
          title: result.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
          description: result.message,
          variant: result.isFollowing ? 'default' : 'destructive',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Error al seguir',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isPending}
      size={size}
      variant={optimisticFollowing ? 'outline' : 'default'}
      className={optimisticFollowing ? 'border-[var(--border)]' : ''}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : optimisticFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Dejar de seguir
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          {targetType === 'USER' ? 'Seguir' : 'Seguir manga'}
        </>
      )}
    </Button>
  );
}
