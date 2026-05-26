'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, AlertCircle, CheckCircle2, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { z } from 'zod';

import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useT } from '@/i18n';


export default function CreateClanPage() {
  const t = useT();
  const { status } = useSession();
  const router = useRouter();
  const clanSchema = useMemo(() => z.object({
    name: z.string().min(3, t('clanCreate.nameMin')).max(50, t('clanCreate.nameMax')),
    description: z.string().max(500).optional(),
  }), [t]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    emblemUrl: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [emblemUploading, setEmblemUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateField = (field: string, value: string) => {
    const shape = clanSchema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }>;
    if (field === 'description') {
      setFieldErrors((prev) => ({ ...prev, description: null }));
      return;
    }
    const result = shape[field]?.safeParse(value);
    setFieldErrors((prev) => ({ ...prev, [field]: result?.success ? null : (result?.error?.issues[0]?.message ?? null) }));
  };

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

    const result = clanSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors_: Record<string, string | null> = {};
      result.error.issues.forEach((issue) => { fieldErrors_[issue.path[0] as string] = issue.message; });
      setFieldErrors(fieldErrors_);
      setTouched({ name: true, description: true });
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
        throw new Error(data.error || t('clanCreate.errorGeneric'));
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
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('clanCreate.errorImageType'));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`${t('clanCreate.errorImageSize')} (${(file.size / 1024 / 1024).toFixed(1)}MB ${t('clanCreate.emblemHint').split(' ').slice(-2).join(' ')}).`);
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
        throw new Error(err.error || t('clanCreate.errorImageUpload'));
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
          {t('clanCreate.backToClans')}
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Users className="text-[var(--primary)]" size={30} aria-hidden="true" />
            {t('clanCreate.title')}
          </h1>
          <p className="text-muted mt-2">
            {t('clanCreate.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-8">
        <form onSubmit={handleSubmit} className="bg-secondary border border-custom rounded-2xl p-8 shadow-sm">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              id="clan-error"
            >
              <ErrorMessage message={error} />
            </motion.div>
          )}
        </AnimatePresence>

          {/* Clan Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-bold mb-2">
              {t('clanCreate.nameLabel')} <span className="text-accent-red">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('clanCreate.namePlaceholder')}
              maxLength={50}
              className={`w-full bg-tertiary border border-custom rounded-xl px-4 py-3 text-fg-primary placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors ${touched.name && fieldErrors.name ? 'border-accent-red' : ''} ${touched.name && !fieldErrors.name && formData.name.length >= 3 ? 'border-[var(--success)]' : ''}`}
              required
              autoComplete="off"
              aria-describedby="name-count clan-error name-feedback"
            />
            <p id="name-count" className="text-xs text-muted mt-2">
              {formData.name.length}/50 {t('clanCreate.charactersSuffix')}
            </p>
            <AnimatePresence>
              {touched.name && !fieldErrors.name && formData.name.length >= 3 && (
                <motion.p
                  id="name-feedback"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1 text-xs text-[var(--success)] mt-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('clanCreate.nameValid')}
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {touched.name && fieldErrors.name && (
                <motion.p
                  id="name-feedback"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1 text-xs text-[var(--error)] mt-1"
                  role="alert"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  {fieldErrors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-bold mb-2">
              {t('clanCreate.descriptionLabel')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('clanCreate.descriptionPlaceholder')}
              rows={4}
              maxLength={500}
              className="w-full bg-tertiary border border-custom rounded-xl px-4 py-3 text-fg-primary placeholder:text-muted focus:outline-none focus:border-accent-purple transition-colors resize-none"
              aria-describedby="desc-count"
            />
            <p id="desc-count" className="text-xs text-muted mt-2">
              {formData.description.length}/500 {t('clanCreate.charactersSuffix')}
            </p>
          </div>

          {/* Emblem */}
          <div className="mb-8">
            <label className="block text-sm font-bold mb-2">
              {t('clanCreate.emblemLabel')}
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
                {emblemUploading ? t('clanCreate.emblemUploading') : formData.emblemUrl ? t('clanCreate.emblemChange') : t('clanCreate.emblemUpload')}
              </p>
            </div>
            <p className="text-xs text-muted mt-2">
              {t('clanCreate.emblemHint')}
            </p>
          </div>

          {/* Preview */}
          {formData.name && (
            <div className="bg-tertiary border border-custom rounded-xl p-6 mb-8">
              <h3 className="text-sm font-bold text-muted uppercase mb-4">{t('clanCreate.preview')}</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-3xl shadow-lg">
                  {formData.emblemUrl ? (
                    <img
                      src={formData.emblemUrl}
                      alt={t('clanCreate.emblemLabel')}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    '👑'
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{formData.name}</h4>
                  <p className="text-sm text-muted">
                    {formData.description || t('clanCreate.noDescription')}
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
                {t('clanCreate.submitting')}
              </>
            ) : (
              <>
                <Users size={20} aria-hidden="true" />
                  {t('clanCreate.submit')}
                </>
              )}
            </button>
            <Link
              href="/community/clans"
              className="flex-1 sm:flex-none bg-tertiary border border-custom hover:border-accent-purple/50 text-fg-primary px-6 py-4 rounded-xl font-bold transition-all text-center"
            >
              {t('clanCreate.cancel')}
            </Link>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-6">
          <h3 className="font-bold text-accent-blue mb-2">{t('clanCreate.infoTitle')}</h3>
          <ul className="text-sm text-muted space-y-2">
            <li>• {t('clanCreate.infoItem1')}</li>
            <li>• {t('clanCreate.infoItem2')}</li>
            <li>• {t('clanCreate.infoItem3')}</li>
            <li>• {t('clanCreate.infoItem4')}</li>
            <li>• {t('clanCreate.infoItem5')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
