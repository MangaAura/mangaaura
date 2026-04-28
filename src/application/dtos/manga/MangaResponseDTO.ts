/**
 * DTO de respuesta con datos de manga
 * @packageDocumentation
 */

import { MangaStatus } from './CreateMangaDTO';

/**
 * Datos de manga que se devuelven en las respuestas de la API
 */
export interface MangaResponseDTO {
  /** ID único del manga */
  id: string;
  /** Título del manga */
  title: string;
  /** Slug único para URLs amigables */
  slug: string;
  /** Descripción del manga */
  description?: string;
  /** URL de la portada */
  coverUrl?: string;
  /** ID del autor */
  authorId: string;
  /** Nombre del autor */
  authorName?: string;
  /** Estado de publicación */
  status: MangaStatus;
  /** Tags/categorías */
  tags: string[];
  /** Total de vistas */
  totalViews: number;
  /** Rating promedio (0-5) */
  rating: number;
  /** Cantidad de capítulos */
  chaptersCount: number;
  /** Fecha de creación */
  createdAt?: string;
  /** Fecha de última actualización */
  updatedAt?: string;
}

/**
 * Versión resumida del manga para listados
 */
export interface MangaSummaryDTO extends Omit<MangaResponseDTO, 'description'> {
  /** Descripción truncada para listados */
  shortDescription?: string;
}

/**
 * Filtros para búsqueda de mangas
 */
export interface MangaFiltersDTO {
  /** Buscar por título */
  search?: string;
  /** Filtrar por estado */
  status?: MangaStatus | MangaStatus[];
  /** Filtrar por tags */
  tags?: string[];
  /** Filtrar por autor */
  authorId?: string;
  /** Ordenar por */
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'totalViews' | 'rating';
  /** Dirección del ordenamiento */
  sortOrder?: 'asc' | 'desc';
  /** Número de página */
  page?: number;
  /** Resultados por página */
  limit?: number;
}

/**
 * Mapea una entidad de dominio Manga a MangaResponseDTO
 * @param manga - Entidad Manga del dominio
 * @returns MangaResponseDTO
 */
export function mapMangaToResponseDTO(manga: {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  authorId: string;
  authorName?: string;
  status: MangaStatus;
  tags: string[];
  totalViews?: number;
  rating?: number;
  chaptersCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}): MangaResponseDTO {
  return {
    id: manga.id,
    title: manga.title,
    slug: manga.slug,
    description: manga.description,
    coverUrl: manga.coverUrl,
    authorId: manga.authorId,
    authorName: manga.authorName,
    status: manga.status,
    tags: manga.tags ?? [],
    totalViews: manga.totalViews ?? 0,
    rating: manga.rating ?? 0,
    chaptersCount: manga.chaptersCount ?? 0,
    createdAt: manga.createdAt?.toISOString(),
    updatedAt: manga.updatedAt?.toISOString(),
  };
}

/**
 * Crea un DTO resumido para listados
 * @param manga - Entidad Manga del dominio
 * @param maxDescriptionLength - Longitud máxima de la descripción
 * @returns MangaSummaryDTO
 */
export function mapMangaToSummaryDTO(
  manga: MangaResponseDTO,
  maxDescriptionLength: number = 150
): MangaSummaryDTO {
  const { description, ...rest } = manga;
  return {
    ...rest,
    shortDescription: description
      ? description.length > maxDescriptionLength
        ? description.substring(0, maxDescriptionLength) + '...'
        : description
      : undefined,
  };
}

/**
 * Datos de paginación
 */
export interface PaginatedMangaResponseDTO {
  /** Lista de mangas */
  items: MangaResponseDTO[];
  /** Total de elementos */
  total: number;
  /** Página actual */
  page: number;
  /** Elementos por página */
  limit: number;
  /** Total de páginas */
  totalPages: number;
}
