'use client';

import {
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  PlusIcon,
  SaveIcon,
  AlertCircleIcon,
  CheckIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, useCallback, useRef, useEffect } from 'react';


import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { useManga } from '@/hooks/useManga';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';


interface PageProps {
  params: Promise<{ slug: string }>;
}

const statusOptionKeys = [
  { value: 'ONGOING' as const, labelKey: 'creatorMangaEdit.statusPublishing' as const, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'COMPLETED' as const, labelKey: 'creatorMangaEdit.statusCompleted' as const, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HIATUS' as const, labelKey: 'creatorMangaEdit.statusPaused' as const, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'DROPPED' as const, labelKey: 'creatorMangaEdit.statusAbandoned' as const, color: 'bg-red-100 text-red-700 border-red-200' },
];

export default function EditMangaPage({ params }: PageProps) {
  const { slug } = use(params);
  const t = useT();
  const router = useRouter();
  const { manga, isLoading, error, updateManga } = useManga({ mangaId: slug });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [tagList, setTagList] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ONGOING');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [_coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when manga loads
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (manga) {
      setFormData({
        title: manga.title,
        description: manga.description,
      });
      setTagList(manga.tags);
      setSelectedStatus(manga.status);
      setCoverPreview(manga.coverUrl || null);
    }
  }, [manga]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('creatorMangaEdit.errorTitleRequired');
    } else if (formData.title.length < 3) {
      newErrors.title = t('creatorMangaEdit.errorTitleMin');
    } else if (formData.title.length > 100) {
      newErrors.title = t('creatorMangaEdit.errorTitleMax');
    }
    
    if (!formData.description.trim()) {
      newErrors.description = t('creatorMangaEdit.errorDescriptionRequired');
    } else if (formData.description.length < 10) {
      newErrors.description = t('creatorMangaEdit.errorDescriptionMin');
    } else if (formData.description.length > 1000) {
      newErrors.description = t('creatorMangaEdit.errorDescriptionMax');
    }

    if (tagList.length === 0) {
      newErrors.tags = t('creatorMangaEdit.errorTagsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, tagList]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, cover: t('creatorMangaEdit.errorImageType') }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, cover: t('creatorMangaEdit.errorImageSize') }));
        return;
      }
      
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, cover: '' }));
    }
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
    setHasChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTag = () => {
    const tag = currentTag.trim().toLowerCase();
    if (tag && !tagList.includes(tag) && tagList.length < 10) {
      setTagList((prev) => [...prev, tag]);
      setCurrentTag('');
      setHasChanges(true);
      setErrors((prev) => ({ ...prev, tags: '' }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagList((prev) => prev.filter((tag) => tag !== tagToRemove));
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status as 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED');
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !manga) {
      return;
    }

    setIsSaving(true);
    try {
      await updateManga(manga.id, {
        title: formData.title,
        description: formData.description,
        tags: tagList,
        status: selectedStatus as 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'DROPPED',
      });
      
      setHasChanges(false);
      // Show success feedback
    } catch {
      // Error handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm(t('creatorMangaEdit.cancelConfirm'))) {
        return;
      }
    }
    if (manga) {
      router.push(`/creator/manga/${manga.slug}`);
    } else {
      router.push('/creator/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface-sunken)]">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
      <div className="h-8 w-48 bg-[var(--border-subtle)] rounded mb-4 animate-pulse" />
      <div className="h-96 bg-[var(--border-subtle)] rounded animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="min-h-screen bg-[var(--surface-sunken)]">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <ErrorMessage
              message={error instanceof Error ? error.message : error || t('creatorMangaEdit.notFound')}
            />
              <Link href="/creator/dashboard">
                <Button variant="outline" className="mt-4">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                  {t('creatorMangaEdit.backToDashboard')}
                </Button>
              </Link>
            </div>
        </main>
      </div>
    );
  }

  const isFormValid = formData.title.length >= 3 && 
                      formData.description.length >= 10 && 
                      tagList.length > 0;

  return (
    <div className="min-h-screen bg-[var(--surface-sunken)]">
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleCancel}>
<Button variant="ghost" size="icon" type="button" aria-label={t('creatorMangaEdit.backToDashboard')}>
        <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
      </Button>
            </button>
            <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t('creatorMangaEdit.title')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
                {t('creatorMangaEdit.subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('creatorMangaEdit.generalInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
          <label htmlFor="edit-manga-title" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {t('creatorMangaEdit.titleLabel')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="edit-manga-title"
            value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder={t('creatorMangaEdit.titlePlaceholder')}
                        error={errors.title}
                        className={cn(
                          !errors.title && formData.title.length >= 3 && 'border-green-500'
                        )}
                      />
                      {!errors.title && formData.title.length >= 3 && (
                        <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                          <CheckIcon className="w-3 h-3" aria-hidden="true" />
                          <span>{t('creatorMangaEdit.titleValid')}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
          <label htmlFor="edit-manga-description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {t('creatorMangaEdit.description')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="edit-manga-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('creatorMangaEdit.descriptionPlaceholder')}
            rows={5}
            aria-required
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? 'edit-desc-error' : 'edit-desc-hint'}
            className={cn(
          'w-full rounded-lg border bg-[var(--surface-elevated)] px-3 py-2 text-sm',
          'placeholder:text-[var(--text-tertiary)]',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                          errors.description && 'border-red-500 focus:ring-red-500',
                          !errors.description && formData.description.length >= 10 && 'border-green-500'
                        )}
                      />
          {errors.description && (
            <p id="edit-desc-error" className="mt-1 text-xs text-red-500 flex items-center gap-1" role="alert">
              <AlertCircleIcon className="w-3 h-3" aria-hidden="true" />
                          {errors.description}
                        </p>
                      )}
          <div className="flex justify-between mt-1">
              <span id="edit-desc-hint" className="text-xs text-[var(--text-tertiary)]">
                  {t('creatorMangaEdit.descriptionMin')}
                  </span>
                  <span className={cn(
                    'text-xs',
                    formData.description.length > 1000 ? 'text-red-500' : 'text-[var(--text-tertiary)]'
                  )}>
                          {formData.description.length}/1000
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {t('creatorMangaEdit.status')}
              </label>
                      <div className="flex flex-wrap gap-2">
                        {statusOptionKeys.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleStatusChange(option.value)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                              option.color,
                              selectedStatus === option.value
                                ? 'ring-2 ring-offset-2 ring-indigo-500'
                                : 'opacity-70 hover:opacity-100'
                            )}
                          >
                            {t(option.labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
              <label htmlFor="edit-manga-tags" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t('creatorMangaEdit.tags')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  id="edit-manga-tags"
                  value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={t('creatorMangaEdit.tagsPlaceholder')}
                          error={errors.tags}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTag}
                          disabled={!currentTag.trim()}
                        >
                          <PlusIcon className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {t('creatorMangaEdit.tagsHint')}
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
                                  aria-label={`Eliminar etiqueta ${tag}`}
                                >
                                  <XIcon className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Cover */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('creatorMangaEdit.cover')}</CardTitle>
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
                            alt="Cover"
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
                  <XIcon className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <UploadIcon className="w-10 h-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t('creatorMangaEdit.coverClick')}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {t('creatorMangaEdit.coverHint')}
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
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1" role="alert">
                  <AlertCircleIcon className="w-3 h-3" aria-hidden="true" />
                        {errors.cover}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('creatorMangaEdit.preview')}</CardTitle>
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
                        {formData.title || t('creatorMangaEdit.previewTitle')}
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
            <Card className="mt-8">
              <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  {t('creatorMangaEdit.cancel')}
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={!isFormValid || !hasChanges}
                  >
                    <SaveIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    {isSaving ? t('creatorMangaEdit.saving') : t('creatorMangaEdit.save')}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </div>
      </main>
    </div>
  );
}
