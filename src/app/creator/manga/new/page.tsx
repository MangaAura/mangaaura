'use client';

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
        setErrors((prev) => ({ ...prev, cover: 'El archivo debe ser una imagen' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, cover: 'La imagen no debe superar 5MB' }));
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
    <div className="min-h-screen bg-slate-50">
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/creator/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Nuevo Manga
            </h1>
            <p className="text-slate-500 mt-1">
              Crea tu nueva historia
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Manga</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      onBlur={() => handleBlur('title')}
                      placeholder="Ej: El Viaje del Héroe"
                      error={touched.title ? errors.title : undefined}
                      className={cn(
                        touched.title && !errors.title && 'border-green-500 focus:ring-green-500'
                      )}
                    />
                    {touched.title && !errors.title && formData.title.length >= 3 && (
                      <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                        <CheckIcon className="w-3 h-3" />
                        <span>Título válido</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      onBlur={() => handleBlur('description')}
                      placeholder="Describe la trama de tu manga..."
                      rows={5}
                      className={cn(
                        'w-full rounded-lg border bg-white px-3 py-2 text-sm',
                        'placeholder:text-slate-400',
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
                      <span className="text-xs text-slate-400">
                        Mínimo 10 caracteres
                      </span>
                      <span className={cn(
                        'text-xs',
                        formData.description.length > 1000 ? 'text-red-500' : 'text-slate-400'
                      )}>
                        {formData.description.length}/1000
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tags <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.tags}
                        onChange={(e) => handleChange('tags', e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Añade tags (presiona Enter)"
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
                    <p className="text-xs text-slate-400 mt-1">
                      Presiona Enter o coma para añadir un tag (máx. 10)
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
                  <CardTitle>Portada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer overflow-hidden transition-colors',
                      coverPreview
                        ? 'border-transparent'
                        : 'border-slate-300 hover:border-indigo-400 bg-slate-50'
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
                          className="absolute top-2 right-2 p-1 bg-white/90 rounded-full hover:bg-white shadow-sm"
                        >
                          <XIcon className="w-4 h-4 text-slate-600" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <UploadIcon className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-sm font-medium text-slate-700">
                          Click para subir
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PNG, JPG hasta 5MB
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
                  <CardTitle>Vista Previa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="aspect-[3/4] bg-slate-200 rounded-lg mb-3 overflow-hidden">
                      {coverPreview ? (
                        <Image
                          src={coverPreview}
                          alt="Preview"
                          width={200}
                          height={280}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <span className="text-4xl font-bold">
                            {formData.title.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                      {formData.title || 'Título del Manga'}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagList.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
            <Link href="/creator/dashboard">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <div className="flex gap-3">
              <Button
                type="submit"
                isLoading={isCreating}
                disabled={!isFormValid}
              >
                {isCreating ? 'Creando...' : 'Crear Manga'}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
