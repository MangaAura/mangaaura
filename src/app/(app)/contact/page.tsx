'use client';

import React, { useState } from 'react';
import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Mail, Send, HelpCircle, MessageSquare, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  const categories = [
    { value: 'general', label: 'Consulta General', icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'support', label: 'Soporte Técnico', icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'dmca', label: 'Reporte DMCA', icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'business', label: 'Negocios', icon: <Mail className="w-4 h-4" /> }
  ];

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo válido';
    }
    if (!formData.subject.trim()) newErrors.subject = 'El asunto es requerido';
    if (!formData.message.trim()) newErrors.message = 'El mensaje es requerido';
    if (formData.message.length < 20) newErrors.message = 'El mensaje debe tener al menos 20 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al enviar');
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setErrors({ ...errors, message: err.message || 'Error al enviar el mensaje. Intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Container className="py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-secondary border border-custom rounded-2xl p-12 shadow-lg">
        <div className="w-20 h-20 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h1 className="text-3xl font-bold mb-4">¡Mensaje Enviado!</h1>
            <p className="text-muted mb-8">
              Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos dentro de las próximas 24-48 horas.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
              }}
              className="bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Enviar otro mensaje
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <PageHeader
        title="Contacto"
        description="¿Tienes preguntas o necesitas ayuda? Estamos aquí para ayudarte."
        icon={<Mail className="w-8 h-8" />}
      />

      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <HelpCircle className="w-6 h-6" />, title: 'FAQ', desc: 'Respuestas rápidas' },
            { icon: <MessageSquare className="w-6 h-6" />, title: 'Soporte', desc: '24-48 horas' },
            { icon: <Mail className="w-6 h-6" />, title: 'Email', desc: 'soporte@inkverse.app' }
          ].map((item, index) => (
            <div key={item.title || `contact-card-${index}`} className="bg-secondary border border-custom rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-3 text-accent-blue">
                {item.icon}
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all',
                    errors.name ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                  )}
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="mt-1 text-sm text-[var(--error)]">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Correo electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all',
                    errors.email ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                  )}
                  placeholder="tu@email.com"
                />
                {errors.email && <p className="mt-1 text-sm text-[var(--error)]">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Categoría</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all',
                      formData.category === cat.value
                        ? 'bg-accent-blue text-[var(--text-inverse)] border-accent-blue'
                        : 'bg-tertiary border-custom hover:border-accent-blue/50'
                    )}
                  >
                    {cat.icon}
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Asunto</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={cn(
                  'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all',
                  errors.subject ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                )}
                placeholder="¿En qué podemos ayudarte?"
              />
              {errors.subject && <p className="mt-1 text-sm text-[var(--error)]">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Mensaje</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className={cn(
                  'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all resize-none',
                  errors.message ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                )}
                placeholder="Describe tu consulta en detalle..."
              />
              {errors.message && <p className="mt-1 text-sm text-[var(--error)]">{errors.message}</p>}
              <p className="mt-1 text-xs text-muted text-right">
                {formData.message.length} caracteres
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar mensaje
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
