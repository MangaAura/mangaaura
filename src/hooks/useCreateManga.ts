'use client';

import { useState, useCallback } from 'react';

interface CreateMangaData {
  title: string;
  description: string;
  tags: string[];
  cover?: File;
}

interface UseCreateMangaReturn {
  isCreating: boolean;
  error: string | null;
  createManga: (data: CreateMangaData) => Promise<{ id: string; slug: string }>;
  validateField: (field: string, value: string) => string | null;
}

export function useCreateManga(): UseCreateMangaReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateField = useCallback((field: string, value: string): string | null => {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'El título es obligatorio';
        if (value.length < 3) return 'El título debe tener al menos 3 caracteres';
        if (value.length > 100) return 'El título debe tener menos de 100 caracteres';
        return null;
      case 'description':
        if (!value.trim()) return 'La descripción es obligatoria';
        if (value.length < 10) return 'La descripción debe tener al menos 10 caracteres';
        if (value.length > 1000) return 'La descripción debe tener menos de 1000 caracteres';
        return null;
      case 'tags':
        if (!value.trim()) return 'Al menos un tag es obligatorio';
        const tags = value.split(',').map(t => t.trim()).filter(t => t);
        if (tags.length === 0) return 'Al menos un tag es obligatorio';
        if (tags.length > 10) return 'Máximo 10 tags permitidos';
        return null;
      default:
        return null;
    }
  }, []);

  const createManga = useCallback(async (data: CreateMangaData): Promise<{ id: string; slug: string }> => {
    try {
      setIsCreating(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('tags', JSON.stringify(data.tags));
      if (data.cover) {
        formData.append('cover', data.cover);
      }

      const response = await fetch('/api/creator/mangas', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el manga');
      }
      
      const result = await response.json();
      return { id: result.id, slug: result.slug };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      throw new Error(message);
    } finally {
      setIsCreating(false);
    }
  }, []);

  return {
    isCreating,
    error,
    createManga,
    validateField,
  };
}
