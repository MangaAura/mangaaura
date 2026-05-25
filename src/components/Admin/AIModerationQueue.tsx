'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';

interface AIFlaggedComment {
  _id: string;
  content: string;
  username: string;
  userId: string;
  toxicity: number;
  spoilerScore: number;
  categories: string[];
  isHidden: boolean;
  requiresReview: boolean;
  createdAt: string;
}

export function AIModerationQueue() {
  const [comments, setComments] = useState<AIFlaggedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending_review' | 'hidden'>('pending_review');

  const fetchComments = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/moderation?status=${filter}&limit=20`);
    const data = await res.json();
    setComments(data.comments || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchComments(); }, [filter]);

  const handleAction = async (commentId: string, action: 'approve' | 'keep_hidden') => {
    await fetch(`/api/admin/moderation/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    fetchComments();
  };

  if (loading) return <div className="p-4">Cargando comentarios...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={filter === 'pending_review' ? 'default' : 'outline'} onClick={() => setFilter('pending_review')}>
          Pendientes de revisión
        </Button>
        <Button variant={filter === 'hidden' ? 'default' : 'outline'} onClick={() => setFilter('hidden')}>
          Ocultos por IA
        </Button>
      </div>
      {comments.length === 0 ? (
        <p className="text-muted-foreground">No hay comentarios en esta categoría</p>
      ) : (
        comments.map((c) => (
          <div key={c._id} className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{c.username}</span>
              <span className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{c.content}</p>
            <div className="flex gap-4 text-xs">
              <span className={c.toxicity >= 70 ? 'text-red-500' : 'text-yellow-500'}>
                Toxicidad: {Math.round(c.toxicity)}%
              </span>
              {c.spoilerScore > 0 && <span>Spoiler: {Math.round(c.spoilerScore)}%</span>}
              {c.categories?.length > 0 && <span>Categorías: {c.categories.join(', ')}</span>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAction(c._id, 'approve')}>Aprobar</Button>
              <Button size="sm" variant="outline" onClick={() => handleAction(c._id, 'keep_hidden')}>Mantener oculto</Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
