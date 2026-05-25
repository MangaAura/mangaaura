'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Mail, Send, HelpCircle, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const t = useT();
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailValid, setEmailValid] = useState(false);

  const validateEmailField = (value: string) => {
    if (!value) {
      setErrors((prev) => ({ ...prev, email: t('contact.form.emailRequired') }));
      setEmailValid(false);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: t('contact.form.emailInvalid') }));
      setEmailValid(false);
    } else {
      setErrors((prev) => {
        const { email: _omitted, ...rest } = prev;
        return rest;
      });
      setEmailValid(true);
    }
  };

  const categories = [
    { value: 'general', label: t('contact.categories.general'), icon: <HelpCircle className="w-4 h-4" /> },
    { value: 'support', label: t('contact.categories.support'), icon: <MessageSquare className="w-4 h-4" /> },
    { value: 'dmca', label: t('contact.categories.dmca'), icon: <AlertCircle className="w-4 h-4" /> },
    { value: 'business', label: t('contact.categories.business'), icon: <Mail className="w-4 h-4" /> }
  ];

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.name.trim()) newErrors.name = t('contact.form.nameRequired');
    if (!formData.email.trim()) {
      newErrors.email = t('contact.form.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.form.emailInvalid');
    }
    if (!formData.subject.trim()) newErrors.subject = t('contact.form.subjectRequired');
    if (!formData.message.trim()) newErrors.message = t('contact.form.messageRequired');
    if (formData.message.length < 20) newErrors.message = t('contact.form.messageMinLength');
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
        throw new Error(data.error || t('contact.form.sendError'));
      }
      setIsSubmitted(true);
    } catch (err: any) {
      setErrors({ ...errors, message: err.message || t('contact.form.error') });
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
          <CheckCircle2 className="w-10 h-10 text-[var(--success)]" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold mb-4">{t('contact.success.title')}</h1>
            <p className="text-muted mb-8">
              {t('contact.success.message')}
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
              }}
              className="bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-medium px-8 py-3 rounded-xl transition-colors"
            >
              {t('contact.success.sendAnother')}
            </button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <PageHeader
        title={t('contact.title')}
        description={t('contact.description')}
        icon={<Mail className="w-8 h-8" aria-hidden="true" />}
      />

      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <HelpCircle className="w-6 h-6" aria-hidden="true" />, title: t('contact.info.faq'), desc: t('contact.info.faqDesc') },
            { icon: <MessageSquare className="w-6 h-6" aria-hidden="true" />, title: t('contact.info.support'), desc: t('contact.info.supportDesc') },
            { icon: <Mail className="w-6 h-6" aria-hidden="true" />, title: t('contact.info.email'), desc: 'soporte@mangaaura.es' }
          ].map((item, index) => (
            <div key={item.title || `contact-card-${index}`} className="bg-secondary border border-custom rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-3 text-accent-blue">
                {item.icon}
              </div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-semibold mb-2">{t('contact.form.name')}</label>
                <input
                  id="contact-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  aria-required
                  autoComplete="name"
                  className={cn(
                    'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all',
                    errors.name ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                  )}
                  placeholder={t('contact.form.namePlaceholder')}
                />
                {errors.name && <p id="contact-name-error" className="mt-1 text-sm text-[var(--error)]">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-semibold mb-2">{t('contact.form.email')}</label>
                <input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (touched.email) validateEmailField(e.target.value);
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, email: true }));
                    validateEmailField(formData.email);
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'contact-email-error' : undefined}
                  aria-required
                  autoComplete="email"
                  className={cn(
                    'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all',
                    errors.email ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                  )}
                  placeholder={t('contact.form.emailPlaceholder')}
                />
                {touched.email && (
                  <AnimatePresence>
                    {errors.email ? (
                      <motion.div
                        id="contact-email-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <ErrorMessage message={errors.email} />
                      </motion.div>
                    ) : emailValid ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        <p className="text-xs text-[var(--success)]">{t('contact.form.emailValid')}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t('contact.form.category')}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    aria-pressed={formData.category === cat.value}
                    aria-label={cat.label}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all',
                      formData.category === cat.value
                        ? 'bg-accent-blue text-[var(--text-inverse)] border-accent-blue'
                        : 'bg-tertiary border-custom hover:border-accent-blue/50'
                    )}
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
                <label htmlFor="contact-subject" className="block text-sm font-semibold mb-2">{t('contact.form.subject')}</label>
                <input
                  id="contact-subject"
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                  aria-required
                  className={cn(
                    'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all',
                    errors.subject ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                  )}
                  placeholder={t('contact.form.subjectPlaceholder')}
                />
              {errors.subject && <p id="contact-subject-error" className="mt-1 text-sm text-[var(--error)]">{errors.subject}</p>}
            </div>

            <div>
                <label htmlFor="contact-message" className="block text-sm font-semibold mb-2">{t('contact.form.message')}</label>
                <textarea
                  id="contact-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  aria-required
                  className={cn(
                  'w-full px-4 py-3 bg-tertiary border rounded-xl outline-none transition-all resize-none',
                  errors.message ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                )}
                placeholder={t('contact.form.messagePlaceholder')}
              />
              {errors.message && <p id="contact-message-error" className="mt-1 text-sm text-[var(--error)]">{errors.message}</p>}
              <p className="mt-1 text-xs text-muted text-right">
                {formData.message.length} {t('contact.form.characters')}
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  {t('contact.form.sending')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" aria-hidden="true" />
                  {t('contact.form.submit')}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
