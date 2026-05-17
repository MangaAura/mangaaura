'use client';

import { useT } from '@/i18n';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCreateManga } from '@/hooks/useCreateManga';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  PlusIcon,
  AlertCircleIcon,
  CheckIcon,
} from 'lucide-react';

export default function NewMangaPage() {
  const router = useRouter();
  const t = useT();
  const { createManga, isCreating, validateField } = useCreateManga();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [tagList, setTagList] = useState<string[]>([]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;
    
    const descError = validateField('description', formData.description);
    if (descError) newErrors.description = descError;
    
    const tagsError = validateField('tags', tagList.join(', '));
    if (tagsError) newErrors.tags = tagsError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, tagList, validateField]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors((prev) => ({ ...prev, [field]: error || '' }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error || '' }));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, cover: t('creatorMangaNew.errorImageType') }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, cover: t('creatorMangaNew.errorImageSize') }));
        return;
      }
      
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, cover: '' }));
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTag = () => {
    const tag = formData.tags.trim().toLowerCase();
    if (tag && !tagList.includes(tag) && tagList.length < 10) {
      setTagList((prev) => [...prev, tag]);
      setFormData((prev) => ({ ...prev, tags: '' }));
      setErrors((prev) => ({ ...prev, tags: '' }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagList((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ title: true, description: true, tags: true });
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createManga({
        title: formData.title,
        description: formData.description,
        tags: tagList,
        cover: coverFile || undefined,
      });
      
      router.push(`/creator/manga/${result.id}`);
    } catch {
      // Error ya manejado en el hook
    }
  };

  const isFormValid = formData.title.length >= 3 && 
                      formData.description.length >= 10 && 
                      tagList.length > 0;

  return (
    <div className="min-h-screen bg-[var(--surface-sunken)]">
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator/dashboard">
            <Button variant="ghost" size="icon" aria-label={t('creatorMangaNew.back')}>
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {t('creatorMangaNew.title')}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {t('creatorMangaNew.subtitle')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('creatorMangaNew.mangaInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('creatorMangaNew.titleLabel')} <span className="text-red-500">*</span>
              </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      onBlur={() => handleBlur('title')}
                      placeholder={t('creatorMangaNew.titlePlaceholder')}
                      error={touched.title ? errors.title : undefined}
                      className={cn(
                        touched.title && !errors.title && 'border-green-500 focus:ring-green-500'
                      )}
                    />
                    {touched.title && !errors.title && formData.title.length >= 3 && (
                      <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                        <CheckIcon className="w-3 h-3" />
                        <span>{t('creatorMangaNew.titleValid')}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('creatorMangaNew.description')} <span className="text-red-500">*</span>
              </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      placeholder={t('creatorMangaNew.descriptionPlaceholder')}
                      rows={5}
                      className={cn(
          'w-full rounded-lg border bg-[var(--surface-elevated)] px-3 py-2 text-sm',
          'placeholder:text-[var(--text-tertiary)]',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                        touched.description && errors.description && 'border-red-500 focus:ring-red-500',
                        touched.description && !errors.description && formData.description.length >= 10 && 'border-green-500'
                      )}
                    />
                    {touched.description && errors.description && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircleIcon className="w-3 h-3" />
                        {errors.description}
                      </p>
                    )}
                    <div className="flex justify-between mt-1">
                  <span className="text-xs text-[var(--text-tertiary)]">
                  {t('creatorMangaNew.descriptionMin')}
                  </span>
                  <span className={cn(
                    'text-xs',
                    formData.description.length > 1000 ? 'text-red-500' : 'text-[var(--text-tertiary)]'
                  )}>
                        {formData.description.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('creatorMangaNew.tags')} <span className="text-red-500">*</span>
              </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.tags}
                        onChange={(e) => handleChange('tags', e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('creatorMangaNew.tagsPlaceholder')}
                        error={touched.tags && tagList.length === 0 ? errors.tags : undefined}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        disabled={!formData.tags.trim()}
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {t('creatorMangaNew.tagsHint')}
            </p>
                    
                    {tagList.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {tagList.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:text-indigo-900"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Cover Upload */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('creatorMangaNew.cover')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer overflow-hidden transition-colors',
                      coverPreview
                        ? 'border-transparent'
                        : 'border-[var(--border)] hover:border-indigo-400 bg-[var(--surface-sunken)]'
                    )}
                  >
                    {coverPreview ? (
                      <>
                        <Image
                          src={coverPreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCover();
                          }}
          className="absolute top-2 right-2 p-1 bg-[var(--surface-elevated)]/90 rounded-full hover:bg-[var(--surface-elevated)] shadow-sm"
        >
          <XIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <UploadIcon className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t('creatorMangaNew.coverClick')}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          {t('creatorMangaNew.coverHint')}
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </div>
                  {errors.cover && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircleIcon className="w-3 h-3" />
                      {errors.cover}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('creatorMangaNew.preview')}</CardTitle>
                </CardHeader>
                <CardContent>
        <div className="bg-[var(--surface-sunken)] rounded-lg p-4">
          <div className="aspect-[3/4] bg-[var(--border-subtle)] rounded-lg mb-3 overflow-hidden">
                      {coverPreview ? (
                        <Image
                          src={coverPreview}
                          alt="Preview"
                          width={200}
                          height={280}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                          <span className="text-4xl font-bold">
                            {formData.title.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">
                      {formData.title || t('creatorMangaNew.previewTitle')}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagList.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-[var(--surface)] text-[var(--text-secondary)] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[var(--border-subtle)]">
            <Link href="/creator/dashboard">
              <Button variant="outline" type="button">
                {t('creatorMangaNew.cancel')}
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button
                type="submit"
                isLoading={isCreating}
                disabled={!isFormValid}
              >
                {isCreating ? t('creatorMangaNew.creating') : t('creatorMangaNew.create')}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
