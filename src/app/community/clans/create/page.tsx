'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Users, ImageIcon, AlertCircle, Loader2 } from 'lucide-react';

export default function CreateClanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emblemUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/community/clans/create');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (formData.name.trim().length > 50) {
      setError('El nombre no puede exceder 50 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/clans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          emblemUrl: formData.emblemUrl.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el clan');
      }

      // Redirect to the new clan
      router.push(`/community/clan/${data.clan.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-background font-sans text-fg-primary pb-12">

    {/* Header */}
      <div className="bg-secondary border-b border-custom">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link
            href="/community/clans"
            className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            Volver a Clanes
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Users className="text-accent-purple" size={32} />
            Crear Nuevo Clan
          </h1>
          <p className="text-muted mt-2">
            Funda tu propio clan y reúne a otros lectores para competir juntos
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-8">
        <form onSubmit={handleSubmit} className="bg-secondary border border-custom rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-accent-red flex-shrink-0 mt-0.5" size={20} />
              <p className="text-accent-red text-sm">{error}</p>
            </div>
          )}

          {/* Clan Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-bold mb-2">
              Nombre del Clan <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Los Guardianes de la Lectura"
              maxLength={50}
              className="w-full bg-tertiary border border-custom rounded-xl px-4 py-3 text-fg-primary placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors"
              required
            />
            <p className="text-xs text-muted mt-2">
              {formData.name.length}/50 caracteres
            </p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-bold mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe tu clan, sus objetivos y qué tipo de miembros buscas..."
              rows={4}
              maxLength={500}
              className="w-full bg-tertiary border border-custom rounded-xl px-4 py-3 text-fg-primary placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors resize-none"
            />
            <p className="text-xs text-muted mt-2">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Emblem URL */}
          <div className="mb-8">
            <label htmlFor="emblemUrl" className="block text-sm font-bold mb-2">
              URL del Emblema
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                type="url"
                id="emblemUrl"
                name="emblemUrl"
                value={formData.emblemUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/emblema.png"
                className="w-full bg-tertiary border border-custom rounded-xl pl-11 pr-4 py-3 text-fg-primary placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors"
              />
            </div>
            <p className="text-xs text-muted mt-2">
              URL de una imagen para el emblema de tu clan (recomendado: 256x256px)
            </p>
          </div>

          {/* Preview */}
          {formData.name && (
            <div className="bg-tertiary border border-custom rounded-xl p-6 mb-8">
              <h3 className="text-sm font-bold text-muted uppercase mb-4">Vista Previa</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-3xl shadow-lg">
                  {formData.emblemUrl ? (
                    <img
                      src={formData.emblemUrl}
                      alt="Emblema"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    '👑'
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{formData.name}</h4>
                  <p className="text-sm text-muted">
                    {formData.description || 'Sin descripción'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent-purple hover:bg-[var(--accent-purple-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-primary)] px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-purple/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creando...
                </>
              ) : (
                <>
                  <Users size={20} />
                  Crear Clan
                </>
              )}
            </button>
            <Link
              href="/community/clans"
              className="flex-1 sm:flex-none bg-tertiary border border-custom hover:border-accent-purple/50 text-fg-primary px-6 py-4 rounded-xl font-bold transition-all text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-6">
          <h3 className="font-bold text-accent-blue mb-2">¿Qué es un Clan?</h3>
          <ul className="text-sm text-muted space-y-2">
            <li>• Los clanes compiten entre sí en temporadas mensuales</li>
            <li>• Gana puntos para tu clan leyendo manga y haciendo correcciones</li>
            <li>• Los mejores clanes reciben recompensas al final de cada temporada</li>
            <li>• Solo puedes ser miembro de un clan a la vez</li>
            <li>• El creador del clan será el líder automáticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
