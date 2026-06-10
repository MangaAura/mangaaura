'use client';

import {
  MegaphoneIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  SendIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import { cn, formatTimeAgo } from '@/lib/utils';

interface MangaAnnouncement {
  id: string;
  mangaId: string;
  authorId: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
  };
}

interface CreatorAnnouncementsManagerProps {
  mangaId?: string; // Si se provee, filtra por manga específico
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CreatorAnnouncementsManager({
  mangaId,
  className,
}: CreatorAnnouncementsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const query = mangaId ? `?mangaId=${mangaId}` : '';
  const { data, error, isLoading, mutate } = useSWR<{
    announcements: MangaAnnouncement[];
  }>(`/api/creator/announcements${query}`, fetcher);

  const announcements = data?.announcements ?? [];

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormError('');
    setFormSuccess('');
  }, []);

  const openEdit = useCallback((a: MangaAnnouncement) => {
    setEditingId(a.id);
    setFormTitle(a.title);
    setFormContent(a.content);
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');
      setFormSuccess('');

      if (!formTitle.trim() || !formContent.trim()) {
        setFormError('El título y contenido son obligatorios');
        return;
      }

      setPublishing(true);
      try {
        if (editingId) {
          // Editar existente
          const res = await fetch(`/api/creator/announcements/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: formTitle.trim(),
              content: formContent.trim(),
            }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al actualizar');
          }
          await mutate();
          setFormSuccess('Anuncio actualizado correctamente');
          // Cerrar form después de mostrar el mensaje
          setTimeout(() => resetForm(), 2000);
        } else if (mangaId) {
          // Crear nuevo
          const res = await fetch('/api/creator/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mangaId,
              title: formTitle.trim(),
              content: formContent.trim(),
              isPublished: true,
            }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Error al crear');
          }
          await mutate();
          setFormSuccess(
            'Anuncio publicado. Los seguidores recibirán una notificación.',
          );
          // Cerrar form después de mostrar el mensaje
          setTimeout(() => resetForm(), 3000);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al guardar');
      } finally {
        setPublishing(false);
      }
    },
    [editingId, mangaId, formTitle, formContent, mutate, resetForm],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('¿Eliminar este anuncio permanentemente?')) return;

      try {
        const res = await fetch(`/api/creator/announcements/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Error al eliminar');
        await mutate();
      } catch (err) {
        console.error('Error deleting announcement:', err);
      }
    },
    [mutate],
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <MegaphoneIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Anuncios
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Comunícate directamente con tus lectores
            </p>
          </div>
        </div>
        {mangaId && !showForm && (
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <PlusIcon className="w-4 h-4 mr-1.5" />
            Nuevo Anuncio
          </Button>
        )}
      </div>

      {/* Formulario */}
      {showForm && mangaId && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[var(--text-primary)]">
              {editingId ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)]"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-500">
              <CheckCircleIcon className="w-4 h-4 shrink-0" />
              {formSuccess}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Título del anuncio
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              placeholder="Ej: ¡Nuevo capítulo esta semana!"
              className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {formTitle.length}/200 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Contenido
            </label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              maxLength={5000}
              rows={4}
              placeholder="Escribe tu mensaje para los lectores..."
              className="w-full px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 resize-y min-h-[100px]"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {formContent.length}/5000 caracteres
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={publishing}>
              <SendIcon className="w-4 h-4 mr-2" />
              {publishing
                ? 'Publicando...'
                : editingId
                ? 'Actualizar Anuncio'
                : 'Publicar Anuncio'}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancelar
            </Button>
          </div>

          {!editingId && (
            <p className="text-xs text-[var(--text-tertiary)] bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
              <MegaphoneIcon className="w-3.5 h-3.5 inline mr-1" />
              Al publicar, los seguidores recibirán una notificación in-app y
              push (si tienen activadas).
            </p>
          )}
        </form>
      )}

      {/* Lista de anuncios */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-[var(--surface-sunken)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <AlertCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 font-medium">Error al cargar anuncios</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => mutate()}
          >
            Reintentar
          </Button>
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-8 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-center">
          <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MegaphoneIcon className="w-7 h-7 text-amber-500" />
          </div>
          <h4 className="font-semibold text-[var(--text-primary)] mb-1">
            No hay anuncios todavía
          </h4>
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {mangaId
              ? 'Crea tu primer anuncio para comunicarte con tus lectores'
              : 'Los anuncios te permiten enviar mensajes directos a tus seguidores'}
          </p>
          {mangaId && (
            <Button
              size="sm"
              onClick={() => { resetForm(); setShowForm(true); }}
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              Crear Primer Anuncio
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-5 space-y-3 hover:border-amber-500/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-[var(--text-primary)] truncate">
                      {a.title}
                    </h4>
                    {a.isPublished ? (
                      <span className="shrink-0 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded-full">
                        Publicado
                      </span>
                    ) : (
                      <span className="shrink-0 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-medium rounded-full">
                        Borrador
                      </span>
                    )}
                  </div>
                  {!mangaId && a.manga && (
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">
                      En: {a.manga.title}
                    </p>
                  )}
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line line-clamp-3">
                    {a.content}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {formatTimeAgo(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {mangaId && (
                    <button
                      onClick={() => openEdit(a)}
                      className="p-2 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                      title="Editar"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
