'use client';

import {
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  AlertCircleIcon,
  CheckIcon,
  CropIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useRef } from 'react';

import { GenreSelector } from '@/components/Creator/GenreSelector';
import { HowToStructuredData } from '@/components/SEO/StructuredData';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ImageCropperUploader, type ImageCropperUploaderHandle } from '@/components/ui/ImageCropperUploader';
import { Input } from '@/components/ui/Input';
import { useCreateManga } from '@/hooks/useCreateManga';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

export default function NewMangaClient() {
  const router = useRouter();
  const t = useT();
  const { createManga, isCreating, error: createError, validateField } = useCreateManga();
  const cropperRef = useRef<ImageCropperUploaderHandle>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
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

  const handleCropConfirm = (croppedBlob: Blob) => {
    // Create a File from the cropped blob using its actual type
    const blobType = croppedBlob.type || 'image/webp';
    const ext = blobType.split('/')[1] || 'webp';
    const croppedFile = new File([croppedBlob], `cover.${ext}`, { type: blobType });
    setCoverFile(croppedFile);

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(croppedBlob);
    setCoverPreview(previewUrl);
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
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
    <>
      <HowToStructuredData
        name="Cómo crear un manga en MangaAura"
        description="Guía paso a paso para crear y publicar tu propio manga en MangaAura. Completa la información, sube una portada, añade tags y crea tu primer capítulo."
        steps={[
          { name: 'Añadir título', text: 'Escribe un título único para tu manga que capture la atención de los lectores.', url: 'https://mangaaura.es/creator/manga/new' },
          { name: 'Escribir descripción', text: 'Describe tu manga: género, historia, personajes y qué hace especial tu obra.' },
          { name: 'Añadir tags', text: 'Añade etiquetas relevantes como acción, romance, fantasía para que los lectores te encuentren.' },
          { name: 'Subir portada', text: 'Sube una portada atractiva con ratio 3:4 que represente tu manga.' },
          { name: 'Crear capítulos', text: 'Una vez creado el manga, podrás subir capítulos y compartirlos con la comunidad.' },
        ]}
      />
      <div className="min-h-screen bg-[var(--surface-sunken)]">
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator/dashboard">
            <Button variant="ghost" size="icon" aria-label={t('creatorMangaNew.back')}>
              <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
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
          <label htmlFor="manga-title" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {t('creatorMangaNew.titleLabel')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="manga-title"
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
                        <CheckIcon className="w-3 h-3" aria-hidden="true" />
                        <span>{t('creatorMangaNew.titleValid')}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
          <label htmlFor="manga-description" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {t('creatorMangaNew.description')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="manga-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder={t('creatorMangaNew.descriptionPlaceholder')}
            rows={5}
            aria-required
            aria-invalid={!!(touched.description && errors.description)}
            aria-describedby={touched.description && errors.description ? 'desc-error' : 'desc-hint'}
            className={cn(
          'w-full rounded-lg border bg-[var(--surface-elevated)] px-3 py-2 text-sm',
          'placeholder:text-[var(--text-tertiary)]',
                        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                        touched.description && errors.description && 'border-red-500 focus:ring-red-500',
                        touched.description && !errors.description && formData.description.length >= 10 && 'border-green-500'
                      )}
                    />
          {touched.description && errors.description && (
            <p id="desc-error" className="mt-1 text-xs text-red-500 flex items-center gap-1" role="alert">
              <AlertCircleIcon className="w-3 h-3" aria-hidden="true" />
                        {errors.description}
                      </p>
                    )}
          <div className="flex justify-between mt-1">
              <span id="desc-hint" className="text-xs text-[var(--text-tertiary)]">
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

                  {/* Genres */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Géneros <span className="text-red-500">*</span>
                    </label>
                    <GenreSelector
                      selected={tagList}
                      onChange={setTagList}
                      error={touched.tags && tagList.length === 0 ? errors.tags : undefined}
                    />
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
                    onClick={() => cropperRef.current?.open()}
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
                  <XIcon className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <UploadIcon className="w-10 h-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t('creatorMangaNew.coverClick')}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          {t('creatorMangaNew.coverHint')}
                        </p>
                      </div>
                    )}
                  </div>
                  {coverPreview && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-tertiary)]">
                      <CropIcon className="w-3 h-3" />
                      <span>Recortada a formato 3:4</span>
                    </div>
                  )}
        {errors.cover && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1" role="alert">
            <AlertCircleIcon className="w-3 h-3" aria-hidden="true" />
                      {errors.cover}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Image Cropper — handles file select + crop lifecycle */}
              <ImageCropperUploader
                ref={cropperRef}
                aspect={3 / 4}
                cropperTitle="Ajustar portada del manga"
                cropperSubtitle="Arrastra para encuadrar · Ratio 3:4 (vertical)"
                onCropComplete={handleCropConfirm}
                onError={(error: string) => setErrors((prev) => ({ ...prev, cover: error }))}
              />

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

          {createError && (
            <div className="mt-8">
              <ErrorMessage message={createError} />
            </div>
          )}

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
    </>
  );
}
