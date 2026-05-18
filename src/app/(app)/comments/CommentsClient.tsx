'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Heart, Reply, Pencil, Trash2, Loader2, Check, X, ExternalLink } from 'lucide-react';

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isHidden: boolean;
  hiddenReason: string | null;
  _count: { likes: number; replies: number };
  chapter: {
    id: string;
    chapterNumber: number;
    title: string | null;
    manga: { id: string; title: string; slug: string; coverUrl: string | null };
  };
}

export function CommentsClient({ comments }: { comments: CommentData[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState(comments);
  const [search, setSearch] = useState('');

  const filtered = search
    ? list.filter((c) => c.content.toLowerCase().includes(search.toLowerCase()) || c.chapter.manga.title.toLowerCase().includes(search.toLowerCase()))
    : list;

  const handleEdit = async (commentId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/chapters/${list.find(c => c.id === commentId)!.chapter.id}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setList((prev) => prev.map((c) => (c.id === commentId ? { ...c, content: editContent } : c)));
        setEditingId(null);
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    const comment = list.find(c => c.id === commentId);
    if (!comment) return;
    try {
      const res = await fetch(`/api/chapters/${comment.chapter.id}/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) setList((prev) => prev.filter((c) => c.id !== commentId));
    } catch {}
  };

  if (list.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={48} className="mx-auto text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Sin comentarios aún</h2>
        <p className="text-muted mb-6">Tus comentarios en capítulos aparecerán aquí</p>
        <Link href="/browse" className="inline-flex items-center gap-2 bg-tertiary hover:bg-custom border border-custom px-6 py-3 rounded-xl font-semibold transition-colors">
          Explorar mangas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar en comentarios..."
        className="w-full px-4 py-3 bg-secondary border border-custom rounded-xl text-sm outline-none focus:border-accent-blue transition-colors"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">No se encontraron comentarios</div>
      ) : (
        filtered.map((comment) => (
          <div key={comment.id} className="bg-secondary border border-custom rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <Link href={`/manga/${comment.chapter.manga.slug}/${comment.chapter.id}`} className="flex items-center gap-2 text-sm text-muted hover:text-accent-blue transition-colors min-w-0">
                <span className="font-semibold truncate">{comment.chapter.manga.title}</span>
                <span className="shrink-0">· Cap. {comment.chapter.chapterNumber}</span>
                <ExternalLink size={12} className="shrink-0" />
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                {editingId !== comment.id && (
                  <>
                    <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="p-1.5 rounded-lg hover:bg-tertiary text-muted hover:text-accent-blue transition-colors cursor-pointer" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(comment.id)} className="p-1.5 rounded-lg hover:bg-tertiary text-muted hover:text-red-500 transition-colors cursor-pointer" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={2000} rows={3} className="w-full px-3 py-2 bg-background border border-custom rounded-lg text-sm outline-none focus:border-accent-blue transition-colors resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(comment.id)} disabled={saving || !editContent.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-accent-green text-white rounded-lg text-xs font-semibold hover:brightness-110 transition-colors disabled:opacity-50 cursor-pointer">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-tertiary border border-custom rounded-lg text-xs font-semibold transition-colors cursor-pointer">
                    <X size={12} /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm mb-3">
                {comment.isHidden ? <span className="italic text-muted">[Comentario oculto: {comment.hiddenReason || 'moderado'}]</span> : comment.content}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><Heart size={12} /> {comment._count.likes}</span>
              <span className="flex items-center gap-1"><Reply size={12} /> {comment._count.replies}</span>
              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
