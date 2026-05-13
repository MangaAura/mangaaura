'use client';

import { use } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { useManga } from '@/hooks/useManga';
import { Skeletons } from '@/components/Skeletons';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  PlusIcon,
  SaveIcon,
  AlertCircleIcon,
  CheckIcon,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const statusOptions = [
  { value: 'ONGOING', label: 'Publicando', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'COMPLETED', label: 'Completado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'HIATUS', label: 'Pausado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'DROPPED', label: 'Abandonado', color: 'bg-red-100 text-red-700 border-red-200' },
];

export default function EditMangaPage({ params }: PageProps) {
  const { slug } = use(params);
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when manga loads
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
      newErrors.title = 'El título es obligatorio';
    } else if (formData.title.length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    } else if (formData.title.length > 100) {
      newErrors.title = 'El título debe tener menos de 100 caracteres';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'La descripción debe tener menos de 1000 caracteres';
    }

    if (tagList.length === 0) {
      newErrors.tags = 'Al menos un tag es obligatorio';
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
      if (!confirm('¿Estás seguro de que deseas cancelar? Se perderán los cambios no guardados.')) {
        return;
      }
    }
    if (manga) {
      router.push(`/creator/manga/${manga.id}`);
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <p className="text-red-600">{error instanceof Error ? error.message : error || 'Manga no encontrado'}</p>
              <Link href="/creator/dashboard">
                <Button variant="outline" className="mt-4">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
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
<Button variant="ghost" size="icon" type="button" aria-label="Volver">
        <ArrowLeftIcon className="w-5 h-5" />
      </Button>
            </button>
            <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Editar Manga
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
                Actualiza la información de tu manga
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Título <span className="text-red-500">*</span>
              </label>
                      <Input
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Título del manga"
                        error={errors.title}
                        className={cn(
                          !errors.title && formData.title.length >= 3 && 'border-green-500'
                        )}
                      />
                      {!errors.title && formData.title.length >= 3 && (
                        <div className="flex items-center gap-1 mt-1 text-green-600 text-xs">
                          <CheckIcon className="w-3 h-3" />
                          <span>Título válido</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Descripción <span className="text-red-500">*</span>
              </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe tu manga..."
                        rows={5}
                        className={cn(
          'w-full rounded-lg border bg-[var(--surface-elevated)] px-3 py-2 text-sm',
          'placeholder:text-[var(--text-tertiary)]',
                          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                          errors.description && 'border-red-500 focus:ring-red-500',
                          !errors.description && formData.description.length >= 10 && 'border-green-500'
                        )}
                      />
                      {errors.description && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircleIcon className="w-3 h-3" />
                          {errors.description}
                        </p>
                      )}
                      <div className="flex justify-between mt-1">
                  <span className="text-xs text-[var(--text-tertiary)]">
                  Mínimo 10 caracteres
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
              Estado
              </label>
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
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
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Tags <span className="text-red-500">*</span>
              </label>
                      <div className="flex gap-2">
                        <Input
                          value={currentTag}
                          onChange={(e) => setCurrentTag(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Añade tags (presiona Enter)"
                          error={errors.tags}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addTag}
                          disabled={!currentTag.trim()}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
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

              {/* Sidebar - Cover */}
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
          <XIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <UploadIcon className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Click para cambiar
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
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

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vista Previa</CardTitle>
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
                        {formData.title || 'Título del Manga'}
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
                  Cancelar
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    isLoading={isSaving}
                    disabled={!isFormValid || !hasChanges}
                  >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
