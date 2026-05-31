'use client';

import { Loader2, UserPlus, UserCheck, UserX, Clock, Check, X, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { useFriend } from '@/hooks/useFriend';
import { cn } from '@/lib/utils';

interface FriendButtonProps {
  targetUserId: string;
  className?: string;
}

export function FriendButton({ targetUserId, className }: FriendButtonProps) {
  const { data: session } = useSession();
  const { status, isLoading, sendRequest, acceptRequest, rejectRequest, removeFriend, cancelRequest } = useFriend(targetUserId);

  if (!session?.user?.id || targetUserId === session.user.id) return null;

  if (isLoading) {
    return (
      <button
        disabled
        className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--surface)] text-[var(--text-tertiary)] cursor-not-allowed', className)}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando...
      </button>
    );
  }

  switch (status) {
    case 'none':
      return (
        <button
          onClick={sendRequest}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-[var(--text-inverse)] hover:opacity-90 transition-all', className)}
        >
          <UserPlus className="w-4 h-4" />
          Agregar amigo
        </button>
      );

    case 'pending_sent':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--warning)]/10 text-[var(--warning)]">
            <Clock className="w-4 h-4" />
            Solicitud enviada
          </span>
          <button
            onClick={cancelRequest}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--surface)] transition-colors"
            title="Cancelar solicitud"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );

    case 'pending_received':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--info)]/10 text-[var(--info)]">
            <Users className="w-4 h-4" />
            Solicitud recibida
          </span>
          <button
            onClick={acceptRequest}
            className="p-2 text-[var(--success)] hover:bg-[var(--success)]/10 rounded-lg transition-colors"
            title="Aceptar"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={rejectRequest}
            className="p-2 text-[var(--error)] hover:bg-[var(--error)]/10 rounded-lg transition-colors"
            title="Rechazar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );

    case 'friends':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--success)]/10 text-[var(--success)]">
            <UserCheck className="w-4 h-4" />
            Amigos
          </span>
          <button
            onClick={removeFriend}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--surface)] transition-colors"
            title="Eliminar amigo"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      );
  }
}

export default FriendButton;
