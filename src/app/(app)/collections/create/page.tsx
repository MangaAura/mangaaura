'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Lock, Globe, Plus } from 'lucide-react';

export default function CreateCollectionPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear colección');
      }

      const { collection } = await response.json();
      router.push('/collections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href="/collections"
          className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a colecciones
        </Link>

        <Card className="p-6">
          <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Crear colección
        </h1>
        <p className="text-[var(--text-secondary)]">
              Organiza tus mangas favoritos en una colección
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mis mangas favoritos"
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
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
              />
              <p className="text-xs text-[var(--text-tertiary)] text-right">
                {description.length}/500
              </p>
            </div>

            {/* Privacy */}
            <div className="space-y-4">
              <Label>Privacidad</Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
          className={`flex-1 p-4 rounded-lg border text-left transition-all ${
            isPublic
              ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Globe className={`w-5 h-5 ${isPublic ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} />
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
          className={`flex-1 p-4 rounded-lg border text-left transition-all ${
            !isPublic
              ? 'border-[var(--primary)] bg-[var(--primary-subtle)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Lock className={`w-5 h-5 ${!isPublic ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)]'}`} />
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

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Link href="/collections" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={!name.trim() || isLoading}
                isLoading={isLoading}
                className="flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear colección
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
