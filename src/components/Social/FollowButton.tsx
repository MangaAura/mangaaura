'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

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
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followingId: targetId,
          followingType: targetType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al seguir');
      }

      setIsFollowing(data.isFollowing);
      onFollowChange?.(data.isFollowing);

      toast({
        title: data.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
        description: data.message,
        variant: data.isFollowing ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al seguir',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      className={isFollowing ? 'border-slate-600' : ''}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
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
