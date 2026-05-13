'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import {
  Shield,
  AlertTriangle,
  UserX,
  Flag,
  Copyright,
  FileQuestion,
  Send,
  Loader2,
  CheckCircle2,
  Link as LinkIcon,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const reportTypes = [
  {
    value: 'USER',
    label: 'Usuario',
    icon: UserX,
    desc: 'Comportamiento inapropiado de un usuario',
    placeholder: 'ID o nombre de usuario',
  },
  {
    value: 'MANGA',
    label: 'Manga',
    icon: FileQuestion,
    desc: 'Contenido de manga inapropiado o infractor',
    placeholder: 'URL o nombre del manga',
  },
  {
    value: 'CHAPTER',
    label: 'Capítulo',
    icon: Flag,
    desc: 'Contenido en un capítulo específico',
    placeholder: 'URL del capítulo',
  },
  {
    value: 'COMMENT',
    label: 'Comentario',
    icon: MessageSquare,
    desc: 'Comentario ofensivo o spam',
    placeholder: 'URL o ID del comentario',
  },
];

const reasons = [
  { value: 'spam', label: 'Spam', icon: AlertTriangle },
  { value: 'harassment', label: 'Acoso', icon: UserX },
  { value: 'inappropriate', label: 'Contenido inapropiado', icon: Shield },
  { value: 'copyright', label: 'Violación de derechos de autor', icon: Copyright },
  { value: 'other', label: 'Otro', icon: FileQuestion },
];

export default function ReportPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    targetType: '',
    targetId: '',
    reason: '',
    description: '',
    evidenceUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isLoggedIn = status === 'authenticated';

  const validateForm = () => {
    if (!formData.targetType) return 'Selecciona qué tipo de contenido quieres reportar';
    if (!formData.targetId.trim()) return 'Indica el contenido a reportar';
    if (!formData.reason) return 'Selecciona un motivo';
    if (formData.description.length > 1000) return 'La descripción no puede exceder 1000 caracteres';
    if (formData.evidenceUrl && !/^https?:\/\/.+/.test(formData.evidenceUrl)) {
      return 'La URL de evidencia no es válida';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al enviar el reporte');
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn && status !== 'loading') {
    return (
      <Container className="py-12">
        <div className="max-w-lg mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Inicia sesión para reportar</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Necesitas una cuenta para enviar reportes y hacer seguimiento de su estado.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </Container>
    );
  }

  if (isSubmitted) {
    return (
      <Container className="py-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 shadow-lg">
        <div className="w-20 h-20 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Reporte enviado</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Tu reporte ha sido recibido. Nuestro equipo de moderación lo revisará en un plazo de 24-48 horas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ targetType: '', targetId: '', reason: '', description: '', evidenceUrl: '' });
                }}
                className="px-6 py-2.5 bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-xl transition-colors"
              >
                Enviar otro reporte
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <PageHeader
        title="Reportar contenido"
        description="Ayúdanos a mantener InkVerse seguro reportando contenido que viole nuestras normas"
        icon={<Shield className="w-8 h-8" />}
      />

      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                ¿Qué quieres reportar?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, targetType: type.value })}
                      className={cn(
                        'flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left',
                        formData.targetType === type.value
                          ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]'
                          : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">{type.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.targetType && (
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Identifica el contenido
                </label>
                <input
                  type="text"
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder={
                    reportTypes.find((t) => t.value === formData.targetType)?.placeholder || 'URL o ID'
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                Motivo del reporte
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reasons.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, reason: r.value })}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm',
                        formData.reason === r.value
                          ? 'bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)] font-medium'
                          : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/30 text-[var(--text-secondary)]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Descripción <span className="text-[var(--text-tertiary)] font-normal">(opcional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors resize-none"
                placeholder="Describe el problema con más detalle..."
              />
              <p className="mt-1 text-xs text-[var(--text-tertiary)] text-right">
                {formData.description.length}/1000
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                URL de evidencia <span className="text-[var(--text-tertiary)] font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="url"
                  value={formData.evidenceUrl}
                  onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder="https://ejemplo.com/captura.png"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !formData.targetType || !formData.reason}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando reporte...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar reporte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Los reportes falsos o malintencionados pueden resultar en acciones contra tu cuenta.
            Solo reporta contenido que realmente viole nuestros{' '}
            <Link href="/legal/terms" className="text-[var(--primary)] hover:underline">
              términos de servicio
            </Link>
            . Los reportes de derechos de autor deben seguir nuestro{' '}
            <Link href="/legal/dmca" className="text-[var(--primary)] hover:underline">
              proceso DMCA
            </Link>
            .
          </p>
        </div>
      </div>
    </Container>
  );
}
