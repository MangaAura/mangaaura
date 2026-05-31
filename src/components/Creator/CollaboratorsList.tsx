'use client';

import { Loader2, UserPlus, Trash2, Shield, Palette, Languages, BookOpenCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { extractApiError } from '@/lib/extract-api-error';
import { cn } from '@/lib/utils';

interface Collaborator {
  id: string;
  role: string;
  invitedAt: string;
  acceptedAt: string | null;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    displayName: string | null;
  };
}

interface CollaboratorsListProps {
  mangaId: string;
  className?: string;
}

const roleIcons: Record<string, typeof Shield> = {
  EDITOR: Shield,
  ARTIST: Palette,
  TRANSLATOR: Languages,
  PROOFREADER: BookOpenCheck,
};

const roleLabels: Record<string, string> = {
  EDITOR: 'Editor',
  ARTIST: 'Artista',
  TRANSLATOR: 'Traductor',
  PROOFREADER: 'Revisor',
};

const roleColors: Record<string, string> = {
  EDITOR: 'text-[var(--info)] bg-[var(--info)]/10',
  ARTIST: 'text-[var(--accent-purple)] bg-[var(--accent-purple)]/10',
  TRANSLATOR: 'text-[var(--success)] bg-[var(--success)]/10',
  PROOFREADER: 'text-[var(--warning)] bg-[var(--warning)]/10',
};

export function CollaboratorsList({ mangaId, className }: CollaboratorsListProps) {
  useSession();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addUsername, setAddUsername] = useState('');
  const [addRole, setAddRole] = useState('EDITOR');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch(`/api/manga/${mangaId}/collaborators`);
      if (!res.ok) throw new Error('Error al cargar colaboradores');
      const data = await res.json();
      setCollaborators(data.collaborators || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [mangaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleAdd = async () => {
    if (!addUsername.trim()) return;
    setIsAdding(true);
    setAddError(null);

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(addUsername)}`);
      if (!res.ok) throw new Error('Usuario no encontrado');
      const data = await res.json();
      const user = data.users?.[0];

      if (!user) {
        setAddError('Usuario no encontrado');
        setIsAdding(false);
        return;
      }

      const addRes = await fetch(`/api/manga/${mangaId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: addRole }),
      });

      if (!addRes.ok) {
        const { message } = await extractApiError(addRes);
        throw new Error(message);
      }

      setAddUsername('');
      await fetchCollaborators();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Error al agregar');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('¿Eliminar este colaborador?')) return;
    try {
      const res = await fetch(`/api/manga/${mangaId}/collaborators?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar');
      setCollaborators((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-bold text-[var(--text-primary)]">Colaboradores</h3>

      {error && <ErrorMessage message={error} />}

      {/* Agregar colaborador */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={addUsername}
          onChange={(e) => setAddUsername(e.target.value)}
          placeholder="Username del colaborador"
          className="flex-1 px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
        />
        <select
          value={addRole}
          onChange={(e) => setAddRole(e.target.value)}
          className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] outline-none"
        >
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={isAdding || !addUsername.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Agregar
        </button>
      </div>

      {addError && <p className="text-xs text-[var(--error)]">{addError}</p>}

      {/* Lista */}
      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
            No hay colaboradores aún. Agrega usuarios para trabajar en equipo.
          </p>
        ) : (
          collaborators.map((collab) => {
            const RoleIcon = roleIcons[collab.role] || Shield;
            return (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  {collab.user.avatarUrl ? (
                    <OptimizedImage
                      src={collab.user.avatarUrl}
                      alt={collab.user.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                      {collab.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {collab.user.displayName || collab.user.username}
                      <span className="text-[var(--text-tertiary)] font-normal"> @{collab.user.username}</span>
                    </p>
                    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-0.5', roleColors[collab.role] || '')}>
                      <RoleIcon className="w-3 h-3" />
                      {roleLabels[collab.role] || collab.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(collab.id)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--surface)] transition-colors"
                  title="Eliminar colaborador"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CollaboratorsList;
