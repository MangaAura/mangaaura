'use client';

import { ArrowLeft, Users, AlertCircle, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, useRef } from 'react';


export default function CreateClanPage() {
  const { status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emblemUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emblemUploading, setEmblemUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/community/clans/create');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status">
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

  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato de imagen no soportado. Usa JPEG, PNG, WebP, GIF o AVIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`La imagen es demasiado grande. Máximo 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB recibido).`);
      return;
    }

    setEmblemUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al subir la imagen');
      }

      const data = await res.json();
      setFormData(prev => ({ ...prev, emblemUrl: data.url }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEmblemUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-background font-sans text-fg-primary pt-20 pb-10">

    {/* Header */}
      <div className="bg-secondary border-b border-custom">
        <div className="max-w-3xl mx-auto px-6 pb-8">
          <Link
            href="/community/clans"
            className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors mb-4"
          >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver a Clanes
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Users className="text-[var(--primary)]" size={30} aria-hidden="true" />
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
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4 mb-6 flex items-start gap-3" role="alert" id="clan-error">
            <AlertCircle className="text-accent-red flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
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
              autoComplete="off"
              aria-describedby="name-count clan-error"
            />
            <p id="name-count" className="text-xs text-muted mt-2">
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
              aria-describedby="desc-count"
            />
            <p id="desc-count" className="text-xs text-muted mt-2">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {/* Emblem */}
          <div className="mb-8">
            <label className="block text-sm font-bold mb-2">
              Emblema del Clan
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
              className="relative flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-custom rounded-xl bg-tertiary hover:border-accent-purple hover:bg-accent-purple/5 transition-all cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleEmblemUpload}
                className="hidden"
              />
              {emblemUploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
              ) : formData.emblemUrl ? (
                <img
                  src={formData.emblemUrl}
                  alt="Emblema"
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <Upload className="w-8 h-8 text-muted" />
              )}
              <p className="text-sm text-muted">
                {emblemUploading ? 'Subiendo...' : formData.emblemUrl ? 'Toca para cambiar imagen' : 'Subir emblema del clan'}
              </p>
            </div>
            <p className="text-xs text-muted mt-2">
              JPEG, PNG, WebP, GIF o AVIF. Máximo 5MB.
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
                      className="w-16 h-16 rounded-xl object-cover"
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
                <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                Creando...
              </>
            ) : (
              <>
                <Users size={20} aria-hidden="true" />
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
