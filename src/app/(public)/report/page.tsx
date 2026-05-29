'use client';

import { motion, AnimatePresence } from 'framer-motion';
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
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';

import { Container } from '@/components/Layout/Container';
import { PageHeader } from '@/components/Layout/PageHeader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reportar Contenido | MangaAura',
  description: 'Reporta contenido inapropiado, infracciones o violaciones en MangaAura.',
  openGraph: {
    title: 'Reportar Contenido | MangaAura',
    description: 'Reporta contenido inapropiado, infracciones o violaciones en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reportar Contenido | MangaAura',
    description: 'Reporta contenido inapropiado en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/report' },
};

export default function ReportPage() {
  const t = useT();
  const { status } = useSession();
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
  const [targetIdError, setTargetIdError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [evidenceUrlError, setEvidenceUrlError] = useState('');
  const [evidenceUrlTouched, setEvidenceUrlTouched] = useState(false);
  const [evidenceUrlValid, setEvidenceUrlValid] = useState(false);

  const reportTypes = [
    {
      value: 'USER',
      label: t('report.form.targetTypeUser'),
      icon: UserX,
      desc: t('report.form.targetTypeUserDesc'),
      placeholder: t('report.form.targetPlaceholderUser'),
    },
    {
      value: 'MANGA',
      label: t('report.form.targetTypeManga'),
      icon: FileQuestion,
      desc: t('report.form.targetTypeMangaDesc'),
      placeholder: t('report.form.targetPlaceholderManga'),
    },
    {
      value: 'CHAPTER',
      label: t('report.form.targetTypeChapter'),
      icon: Flag,
      desc: t('report.form.targetTypeChapterDesc'),
      placeholder: t('report.form.targetPlaceholderChapter'),
    },
    {
      value: 'COMMENT',
      label: t('report.form.targetTypeComment'),
      icon: MessageSquare,
      desc: t('report.form.targetTypeCommentDesc'),
      placeholder: t('report.form.targetPlaceholderComment'),
    },
  ];

  const reasons = [
    { value: 'spam', label: t('report.form.reasonSpam'), icon: AlertTriangle },
    { value: 'harassment', label: t('report.form.reasonHarassment'), icon: UserX },
    { value: 'inappropriate', label: t('report.form.reasonInappropriate'), icon: Shield },
    { value: 'copyright', label: t('report.form.reasonCopyright'), icon: Copyright },
    { value: 'other', label: t('report.form.reasonOther'), icon: FileQuestion },
  ];

  const isLoggedIn = status === 'authenticated';

  const validateUrlField = (value: string) => {
    if (!value) {
      setEvidenceUrlError('');
      setEvidenceUrlValid(false);
    } else if (!/^https?:\/\/.+/.test(value)) {
      setEvidenceUrlError(t('report.form.invalidUrl'));
      setEvidenceUrlValid(false);
    } else {
      setEvidenceUrlError('');
      setEvidenceUrlValid(true);
    }
  };

  const validateForm = () => {
    if (!formData.targetType) return t('report.form.typeRequired');
    if (!formData.targetId.trim()) return t('report.form.targetRequired');
    if (!formData.reason) return t('report.form.reasonRequired');
    if (formData.description.length > 1000) return t('report.form.maxLengthError');
    if (formData.evidenceUrl && !/^https?:\/\/.+/.test(formData.evidenceUrl)) {
      return t('report.form.invalidUrl');
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTargetIdError('');
    setDescriptionError('');
    setEvidenceUrlError('');
    const validationError = validateForm();
    if (validationError) {
      if (validationError === t('report.form.targetRequired')) {
        setTargetIdError(validationError);
      } else if (validationError === t('report.form.maxLengthError')) {
        setDescriptionError(validationError);
      } else if (validationError === t('report.form.invalidUrl')) {
        setEvidenceUrlError(validationError);
      } else {
        setError(validationError);
      }
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
        setError(data.error || t('report.form.submitError'));
        return;
      }

      setIsSubmitted(true);
    } catch {
      setError(t('report.form.connectionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn && status !== 'loading') {
    return (
      <Container className="py-12">
        <div className="max-w-lg mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-[var(--text-tertiary)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{t('report.notLoggedIn.title')}</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {t('report.notLoggedIn.description')}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
          >
            {t('report.notLoggedIn.login')}
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
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('report.success.title')}</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              {t('report.success.message')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ targetType: '', targetId: '', reason: '', description: '', evidenceUrl: '' });
                }}
                className="px-6 py-2.5 bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-xl transition-colors"
              >
                {t('report.success.sendAnother')}
              </button>
              <Link
                href="/"
                className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-medium rounded-xl transition-colors"
              >
                {t('report.success.backHome')}
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
        title={t('report.title')}
        description={t('report.description')}
        icon={<Shield className="w-8 h-8" />}
      />

      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          {error && (
            <div id="report-global-error" className="mb-6">
              <ErrorMessage message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" aria-describedby={error ? 'report-global-error' : undefined}>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                {t('report.form.whatToReport')}
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
                <label htmlFor="report-target" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t('report.form.targetLabel')}
                </label>
                <input
                  id="report-target"
                  type="text"
                  value={formData.targetId}
                  onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors"
                  placeholder={
                    reportTypes.find((rt) => rt.value === formData.targetType)?.placeholder || 'URL o ID'
                  }
                  aria-required
                  aria-invalid={!!targetIdError}
                  aria-describedby="target-id-error"
                  autoComplete="url"
                />
                {targetIdError && (
                  <p id="target-id-error" className="mt-1 text-sm text-[var(--error)]" role="alert">{targetIdError}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
                {t('report.form.reportReason')}
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
                <label htmlFor="report-description" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t('report.form.description')} <span className="text-[var(--text-tertiary)] font-normal">{t('report.form.descriptionOptional')}</span>
                </label>
                <textarea
                  id="report-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--primary)] transition-colors resize-none"
                  placeholder={t('report.form.descriptionPlaceholder')}
                  aria-invalid={!!descriptionError}
                  aria-describedby="description-error"
                />
                {descriptionError && (
                  <p id="description-error" className="mt-1 text-sm text-[var(--error)]" role="alert">{descriptionError}</p>
                )}
                <p className="mt-1 text-xs text-[var(--text-tertiary)] text-right">
                  {formData.description.length}/1000
                </p>
              </div>

<div>
                <label htmlFor="report-evidence" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t('report.form.evidence')} <span className="text-[var(--text-tertiary)] font-normal">{t('report.form.evidenceOptional')}</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
                    <input
                    id="report-evidence"
                    type="url"
                    value={formData.evidenceUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, evidenceUrl: e.target.value });
                      if (evidenceUrlTouched) validateUrlField(e.target.value);
                    }}
                    onBlur={() => {
                      setEvidenceUrlTouched(true);
                      validateUrlField(formData.evidenceUrl);
                    }}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-[var(--background)] border rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors',
                      evidenceUrlTouched && evidenceUrlValid && formData.evidenceUrl
                        ? 'border-[var(--success)]'
                        : evidenceUrlError
                          ? 'border-[var(--error)]'
                          : 'border-[var(--border)] focus:border-[var(--primary)]'
                    )}
                    placeholder={t('report.form.evidencePlaceholder')}
                    autoComplete="url"
                    aria-invalid={!!evidenceUrlError}
                    aria-describedby="evidence-url-error"
                  />
                </div>
                {evidenceUrlTouched && (
                  <AnimatePresence>
                    {evidenceUrlError ? (
                      <motion.div
                        id="evidence-url-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <ErrorMessage message={evidenceUrlError} />
                      </motion.div>
                    ) : evidenceUrlValid && formData.evidenceUrl ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        <p className="text-xs text-[var(--success)]">{t('report.form.validUrl')}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}
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
                    {t('report.form.sending')}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t('report.form.submit')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('report.disclaimerPart1')}
            <Link href="/legal/terms" className="text-[var(--primary)] hover:underline">
              {t('report.termsOfService')}
            </Link>
            {t('report.disclaimerPart2')}
            <Link href="/legal/dmca" className="text-[var(--primary)] hover:underline">
              {t('report.dmcaProcess')}
            </Link>
            {t('report.disclaimerPart3')}
          </p>
        </div>
      </div>
    </Container>
  );
}
