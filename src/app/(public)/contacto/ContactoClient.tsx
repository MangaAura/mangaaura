'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Send,
  MessageSquare,
  HelpCircle,
  Users,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Camera,
  Clapperboard,
  Music,
  Disc,
  X,
  ExternalLink,
  Sparkles,
  Heart,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

const socialLinks = [
  { name: 'X', icon: X, href: 'https://mangaaura.es', color: 'hover:bg-[#000]/20 hover:border-[#000]/50' },
  { name: 'Instagram', icon: Camera, href: 'https://mangaaura.es', color: 'hover:bg-[#E4405F]/20 hover:border-[#E4405F]/50' },
  { name: 'YouTube', icon: Clapperboard, href: 'https://mangaaura.es', color: 'hover:bg-[#FF0000]/20 hover:border-[#FF0000]/50' },
  { name: 'TikTok', icon: Music, href: 'https://mangaaura.es', color: 'hover:bg-[#000]/20 hover:border-[#000]/50' },
  { name: 'Discord', icon: Disc, href: '#', color: 'opacity-50 pointer-events-none', disabled: true },
];

const faqItems = [
  {
    question: 'contacto.faq.q1',
    answer: 'contacto.faq.a1',
    icon: <Star className="w-5 h-5" />,
  },
  {
    question: 'contacto.faq.q2',
    answer: 'contacto.faq.a2',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    question: 'contacto.faq.q3',
    answer: 'contacto.faq.a3',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    question: 'contacto.faq.q4',
    answer: 'contacto.faq.a4',
    icon: <Heart className="w-5 h-5" />,
  },
];

export default function ContactoClient() {
  const t = useT();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof formData>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailValid, setEmailValid] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    { value: 'dmca', label: t('contact.categories.dmca'), icon: <Shield className="w-4 h-4" /> },
    { value: 'business', label: t('contact.categories.business'), icon: <Mail className="w-4 h-4" /> },
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
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none" />
        <Container className="py-12 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="bg-gradient-to-br from-[var(--surface)] via-[var(--surface-elevated)] to-[var(--surface)] border border-[var(--border)] rounded-3xl p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 to-[var(--accent-purple)]/5 pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[var(--accent-purple)]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 bg-gradient-to-br from-[var(--success)]/20 to-[var(--primary)]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--success)]/30"
                >
                  <CheckCircle2 className="w-12 h-12 text-[var(--success)]" />
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--text-primary)] to-[var(--primary)] bg-clip-text text-transparent">
                  {t('contact.success.title')}
                </h1>
                <p className="text-[var(--text-secondary)] mb-8 text-lg">
                  {t('contact.success.message')}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '', category: 'general' });
                  }}
                  className="relative px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-bold rounded-2xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-xl hover:shadow-[var(--primary)]/30 transition-all"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {t('contact.success.sendAnother')}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-purple)]/10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[var(--primary)]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none" />

      <Container className="py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageHeader
            title={t('contact.title')}
            description={t('contact.description')}
            icon={<Mail className="w-8 h-8" />}
          />
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <HelpCircle className="w-7 h-7" />,
                title: t('contact.info.faq'),
                desc: t('contact.info.faqDesc'),
                gradient: 'from-[var(--primary)] to-[var(--accent-purple)]',
                glow: 'shadow-[var(--primary)]/20',
                delay: 0.1,
              },
              {
                icon: <MessageSquare className="w-7 h-7" />,
                title: t('contact.info.support'),
                desc: t('contact.info.supportDesc'),
                gradient: 'from-[var(--accent-blue)] to-[var(--primary)]',
                glow: 'shadow-[var(--accent-blue)]/20',
                delay: 0.2,
              },
              {
                icon: <Mail className="w-7 h-7" />,
                title: t('contact.info.email'),
                desc: 'soporte@mangaaura.es',
                gradient: 'from-[var(--accent-purple)] to-[var(--accent-red)]',
                glow: 'shadow-[var(--accent-purple)]/20',
                delay: 0.3,
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.delay, duration: 0.4 }}
                className="group relative"
              >
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-sm',
                  item.gradient
                )} />
                <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 h-full group-hover:border-[var(--primary)]/30 transition-all duration-300">
                  <div className={cn(
                    'w-14 h-14 bg-gradient-to-br rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg',
                    item.gradient,
                    item.glow
                  )}>
                    {item.icon}
                  </div>
                  <h2 className="font-bold text-xl mb-2 text-[var(--text-primary)]">{item.title}</h2>
                  <p className="text-[var(--text-primary)]/80">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="lg:col-span-2"
            >
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">Síguenos</h2>
                </div>
                <p className="text-[var(--text-secondary)] mb-6">
                  Conecta con nuestra comunidad en redes sociales. ¡No te pierdas ninguna actualización!
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={social.name}
                        href={social.href}
                        target={social.disabled ? undefined : '_blank'}
                        rel={social.disabled ? undefined : 'noopener noreferrer'}
                        whileHover={social.disabled ? {} : { scale: 1.05 }}
                        whileTap={social.disabled ? {} : { scale: 0.95 }}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl transition-all duration-300',
                          social.color,
                          social.disabled && 'cursor-not-allowed'
                        )}
                      >
                        <Icon className="w-5 h-5 text-[var(--text-primary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {social.name}
                          {social.disabled && (
                            <span className="ml-1.5 text-xs text-[var(--text-tertiary)]">(Próximamente)</span>
                          )}
                        </span>
                        {!social.disabled && <ExternalLink className="w-3 h-3 ml-auto text-[var(--text-tertiary)]" />}
                      </motion.a>
                    );
                  })}
                </div>

                <div className="border-t border-[var(--border)] pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">Tiempo de respuesta</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Normalmente respondemos en 24-48 horas. Para consultas urgentes,únete a nuestro Discord.
                  </p>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent-purple)]/10 border border-[var(--primary)]/20 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)] mb-1">¿Eres creador?</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Si quieres publicar tu manga en MangaAura, selecciona "Negocio" como categoría.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="lg:col-span-3"
            >
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[var(--accent-purple)]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-xl flex items-center justify-center">
                      <Send className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Envíanos un mensaje</h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contacto-name" className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                          {t('contact.form.name')}
                        </label>
                        <input
                          id="contacto-name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          aria-invalid={!!errors.name}
                          aria-describedby={errors.name ? 'contacto-name-error' : undefined}
                          aria-required
                          autoComplete="name"
                          className={cn(
                            'w-full px-4 py-3.5 bg-[var(--surface-elevated)] border rounded-xl outline-none transition-all',
                            errors.name ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--primary)]'
                          )}
                          placeholder={t('contact.form.namePlaceholder')}
                        />
                        {errors.name && (
                          <p id="contacto-name-error" className="mt-1 text-sm text-[var(--error)]">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="contacto-email" className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                          {t('contact.form.email')}
                        </label>
                        <input
                          id="contacto-email"
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
                          aria-describedby={errors.email ? 'contacto-email-error' : undefined}
                          aria-required
                          autoComplete="email"
                          className={cn(
                            'w-full px-4 py-3.5 bg-[var(--surface-elevated)] border rounded-xl outline-none transition-all',
                            errors.email ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--primary)]'
                          )}
                          placeholder={t('contact.form.emailPlaceholder')}
                        />
                        {touched.email && (
                          <AnimatePresence>
                            {errors.email ? (
                              <motion.div
                                id="contacto-email-error"
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
                      <label className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                        {t('contact.form.category')}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.value })}
                            aria-pressed={formData.category === cat.value}
                            aria-label={cat.label}
                            className={cn(
                              'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200',
                              formData.category === cat.value
                                ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] border-transparent shadow-lg shadow-[var(--primary)]/20'
                                : 'bg-[var(--surface-elevated)] border-[var(--border)] hover:border-[var(--primary)]/50'
                            )}
                          >
                            <span aria-hidden="true">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="contacto-subject" className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                        {t('contact.form.subject')}
                      </label>
                      <input
                        id="contacto-subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        aria-invalid={!!errors.subject}
                        aria-describedby={errors.subject ? 'contacto-subject-error' : undefined}
                        aria-required
                        className={cn(
                          'w-full px-4 py-3.5 bg-[var(--surface-elevated)] border rounded-xl outline-none transition-all',
                          errors.subject ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--primary)]'
                        )}
                        placeholder={t('contact.form.subjectPlaceholder')}
                      />
                      {errors.subject && (
                        <p id="contacto-subject-error" className="mt-1 text-sm text-[var(--error)]">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contacto-message" className="block text-sm font-semibold mb-2 text-[var(--text-primary)]">
                        {t('contact.form.message')}
                      </label>
                      <textarea
                        id="contacto-message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'contacto-message-error' : undefined}
                        aria-required
                        className={cn(
                          'w-full px-4 py-3.5 bg-[var(--surface-elevated)] border rounded-xl outline-none transition-all resize-none',
                          errors.message ? 'border-[var(--error)]' : 'border-[var(--border)] focus:border-[var(--primary)]'
                        )}
                        placeholder={t('contact.form.messagePlaceholder')}
                      />
                      {errors.message && (
                        <p id="contacto-message-error" className="mt-1 text-sm text-[var(--error)]">{errors.message}</p>
                      )}
                      <p className="mt-1 text-xs text-[var(--text-tertiary)] text-right">
                        {formData.message.length} {t('contact.form.characters')}
                      </p>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full relative px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-bold rounded-2xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-xl hover:shadow-[var(--primary)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('contact.form.sending')}
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            {t('contact.form.submit')}
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-red)] rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Preguntas Frecuentes</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--surface-elevated)]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent-purple)]/20 rounded-lg flex items-center justify-center text-[var(--primary)]">
                        {item.icon}
                      </div>
                      <span className="font-medium text-[var(--text-primary)] pr-4">
                        {t(item.question)}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200',
                        openFaq === index && 'rotate-180'
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 pt-0">
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-11">
                            {t(item.answer)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[var(--text-secondary)] mb-4">
                ¿No encontraste lo que buscabas?
              </p>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-[var(--text-inverse)] font-medium rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30 transition-all"
              >
                <HelpCircle className="w-5 h-5" />
                Ver todas las FAQ
              </Link>
            </div>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
