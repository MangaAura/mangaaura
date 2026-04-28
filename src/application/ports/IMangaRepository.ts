/**
 * Interfaz del repositorio de mangas (Port en Clean Architecture)
 * Define el contrato que debe implementar cualquier adaptador de persistencia
 * @packageDocumentation
 */

import { MangaStatus } from '../dtos/manga/CreateMangaDTO';

/**
 * Entidad Manga del dominio (versión simplificada para el puerto)
 */
export interface MangaSeries {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverUrl?: string;
  authorId: string;
  status: MangaStatus;
  tags: string[];
  totalViews: number;
  rating: number;
  chaptersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filtros para búsqueda de mangas
 */
export interface MangaFilters {
  /** Buscar por título (parcial) */
  title?: string;
  /** Filtrar por estado */
  status?: MangaStatus | MangaStatus[];
  /** Filtrar por tags */
  tags?: string[];
  /** Filtrar por autor */
  authorId?: string;
  /** Ordenar por campo */
  orderBy?: 'title' | 'createdAt' | 'updatedAt' | 'totalViews' | 'rating';
  /** Dirección del ordenamiento */
  orderDirection?: 'asc' | 'desc';
  /** Número de página */
  page?: number;
  /** Resultados por página */
  limit?: number;
}

/**
 * Interfaz del puerto de repositorio de mangas
 * Esta interfaz debe ser implementada por los adaptadores de infraestructura
 */
export interface IMangaRepository {
  /**
   * Busca un manga por su ID
   * @param id - ID del manga
   * @returns El manga encontrado o null
   */
  findById(id: string): Promise<MangaSeries | null>;

  /**
   * Busca un manga por su slug único
   * @param slug - Slug del manga
   * @returns El manga encontrado o null
   */
  findBySlug(slug: string): Promise<MangaSeries | null>;

  /**
   * Busca mangas con filtros opcionales
   * @param filters - Filtros de búsqueda
   * @returns Array de mangas que coinciden con los filtros
   */
  findAll(filters?: MangaFilters): Promise<MangaSeries[]>;

  /**
   * Crea un nuevo manga
   * @param data - Datos del manga a crear
   * @returns El manga creado
   */
  create(data: {
    title: string;
    slug: string;
    description?: string;
    coverUrl?: string;
    authorId: string;
    status?: MangaStatus;
    tags?: string[];
  }): Promise<MangaSeries>;

  /**
   * Actualiza un manga existente
   * @param id - ID del manga
   * @param data - Datos a actualizar
   * @returns El manga actualizado
   * @throws Error si el manga no existe
   */
  update(id: string, data: {
    title?: string;
    slug?: string;
    description?: string;
    coverUrl?: string;
    status?: MangaStatus;
    tags?: string[];
  }): Promise<MangaSeries>;

  /**
   * Elimina un manga por su ID
   * @param id - ID del manga
   * @throws Error si el manga no existe
   */
  delete(id: string): Promise<void>;

  /**
   * Incrementa el contador de vistas del manga
   * @param id - ID del manga
   * @returns Nuevo total de vistas
   */
  incrementViewCount(id: string): Promise<number>;

  /**
   * Actualiza el rating del manga
   * @param id - ID del manga
   * @param newRating - Nuevo rating promedio
   * @returns El manga actualizado
   */
  updateRating(id: string, newRating: number): Promise<MangaSeries>;

  /**
   * Incrementa el contador de capítulos
   * @param id - ID del manga
   * @returns Nuevo conteo de capítulos
   */
  incrementChapterCount(id: string): Promise<number>;

  /**
   * Busca mangas por autor
   * @param authorId - ID del autor
   * @returns Array de mangas del autor
   */
  findByAuthor(authorId: string): Promise<MangaSeries[]>;

  /**
   * Verifica si existe un manga con el slug dado
   * @param slug - Slug a verificar
   * @returns true si existe, false en caso contrario
   */
  existsBySlug(slug: string): Promise<boolean>;

  /**
   * Obtiene mangas populares por vistas
   * @param limit - Cantidad de mangas a retornar
   * @returns Array de mangas ordenados por vistas
   */
  getPopular(limit?: number): Promise<MangaSeries[]>;

  /**
   * Obtiene mangas mejor valorados
   * @param limit - Cantidad de mangas a retornar
   * @returns Array de mangas ordenados por rating
   */
  getTopRated(limit?: number): Promise<MangaSeries[]>;

  /**
   * Obtiene la cantidad total de mangas
   * @returns Número total de mangas
   */
  count(filters?: Omit<MangaFilters, 'page' | 'limit' | 'orderBy' | 'orderDirection'>): Promise<number>;
}

/**
 * Error lanzado cuando un manga no es encontrado
 */
export class MangaNotFoundError extends Error {
  readonly code = 'MANGA_NOT_FOUND';
  readonly isOperational = true;
  constructor(identifier: string) {
    super(`Manga no encontrado: ${identifier}`);
    this.name = 'MangaNotFoundError';
  }
}

/**
 * Error lanzado cuando el slug ya está en uso
 */
export class SlugAlreadyExistsError extends Error {
  readonly code = 'SLUG_ALREADY_EXISTS';
  readonly isOperational = true;
  constructor(slug: string) {
    super(`El slug ya está en uso: ${slug}`);
    this.name = 'SlugAlreadyExistsError';
  }
}
