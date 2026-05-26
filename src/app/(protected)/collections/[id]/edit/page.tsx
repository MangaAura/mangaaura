'use client';

import { ArrowLeft, Lock, Globe, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { updateCollection } from '@/app/(protected)/collections/actions';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/collections/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('No encontrada');
        return res.json();
      })
      .then((data) => {
        setName(data.title || '');
        setDescription(data.description || '');
        setIsPublic(data.isPublic ?? true);
      })
      .catch(() => setError('No se pudo cargar la colección'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);

    startTransition(async () => {
      try {
        await updateCollection(id, {
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic,
        });
        router.push(`/collections/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión. Verifica tu internet e inténtalo de nuevo.');
      }
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface-sunken)] rounded w-1/3" />
          <div className="h-64 bg-[var(--surface-sunken)] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/collections/${id}`}
          className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Volver a la colección
        </Link>

        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Editar colección
            </h1>
            <p className="text-[var(--text-secondary)]">
              Actualiza los detalles de tu colección
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mis mangas favoritos"
                maxLength={100}
                required
                autoComplete="off"
                aria-describedby={error ? 'collection-error' : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe qué mangas incluirás..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)] text-[var(--text-primary)] resize-none"
                aria-describedby="description-count"
              />
              <p id="description-count" className="text-xs text-[var(--text-tertiary)] text-right">
                {description.length}/500
              </p>
            </div>

            <div className="space-y-4">
              <Label>Privacidad</Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  aria-pressed={isPublic}
                  className={`flex-1 p-4 rounded-lg border text-left transition-all ${
                    isPublic
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className={`w-5 h-5 ${isPublic ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} aria-hidden="true" />
                    <div>
                      <p className={`font-medium ${isPublic ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        Pública
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Cualquiera puede ver y seguir
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  aria-pressed={!isPublic}
                  className={`flex-1 p-4 rounded-lg border text-left transition-all ${
                    !isPublic
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Lock className={`w-5 h-5 ${!isPublic ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} aria-hidden="true" />
                    <div>
                      <p className={`font-medium ${!isPublic ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        Privada
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Solo tú puedes ver
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div id="collection-error">
                <ErrorMessage message={error} />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Link href={`/collections/${id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!name.trim() || isPending}
                isLoading={isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
