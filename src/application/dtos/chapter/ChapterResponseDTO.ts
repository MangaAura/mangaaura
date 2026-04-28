/**
 * DTO de respuesta con datos de capítulo
 * @packageDocumentation
 */

/**
 * Datos de capítulo que se devuelven en las respuestas de la API
 */
export interface ChapterResponseDTO {
  /** ID único del capítulo */
  id: string;
  /** ID del manga al que pertenece */
  mangaId: string;
  /** Número del capítulo */
  chapterNumber: number;
  /** Título del capítulo */
  title?: string;
  /** Total de páginas */
  totalPages: number;
  /** URLs de las páginas (solo para lectura) */
  pageUrls?: string[];
  /** Cantidad de vistas */
  viewCount: number;
  /** Si está disponible mediante crowdfunding */
  isCrowdfunded: boolean;
  /** Meta de crowdfunding */
  crowdfundingGoal?: number;
  /** Monto actual recaudado (si aplica crowdfunding) */
  crowdfundingCurrent?: number;
  /** Fecha de publicación */
  publishedAt?: string;
  /** Fecha de creación */
  createdAt?: string;
  /** Fecha de última actualización */
  updatedAt?: string;
}

/**
 * Versión resumida del capítulo para listados
 */
export interface ChapterSummaryDTO {
  /** ID único del capítulo */
  id: string;
  /** Número del capítulo */
  chapterNumber: number;
  /** Título del capítulo */
  title?: string;
  /** Total de páginas */
  totalPages: number;
  /** Cantidad de vistas */
  viewCount: number;
  /** Si está disponible mediante crowdfunding */
  isCrowdfunded: boolean;
  /** Fecha de publicación */
  publishedAt?: string;
}

/**
 * Mapea una entidad de dominio Chapter a ChapterResponseDTO
 * @param chapter - Entidad Chapter del dominio
 * @returns ChapterResponseDTO
 */
export function mapChapterToResponseDTO(chapter: {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title?: string;
  totalPages: number;
  pageUrls?: string[];
  viewCount?: number;
  isCrowdfunded?: boolean;
  crowdfundingGoal?: number;
  crowdfundingCurrent?: number;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}): ChapterResponseDTO {
  return {
    id: chapter.id,
    mangaId: chapter.mangaId,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    totalPages: chapter.totalPages,
    pageUrls: chapter.pageUrls,
    viewCount: chapter.viewCount ?? 0,
    isCrowdfunded: chapter.isCrowdfunded ?? false,
    crowdfundingGoal: chapter.crowdfundingGoal,
    crowdfundingCurrent: chapter.crowdfundingCurrent,
    publishedAt: chapter.publishedAt?.toISOString(),
    createdAt: chapter.createdAt?.toISOString(),
    updatedAt: chapter.updatedAt?.toISOString(),
  };
}

/**
 * Crea un DTO resumido para listados
 * @param chapter - Entidad Chapter del dominio o DTO completo
 * @returns ChapterSummaryDTO
 */
export function mapChapterToSummaryDTO(
  chapter: ChapterResponseDTO | {
    id: string;
    chapterNumber: number;
    title?: string;
    totalPages: number;
    viewCount?: number;
    isCrowdfunded?: boolean;
    publishedAt?: Date | string;
  }
): ChapterSummaryDTO {
  return {
    id: chapter.id,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    totalPages: chapter.totalPages,
    viewCount: (chapter as { viewCount?: number }).viewCount ?? 0,
    isCrowdfunded: (chapter as { isCrowdfunded?: boolean }).isCrowdfunded ?? false,
    publishedAt: chapter.publishedAt
      ? typeof chapter.publishedAt === 'string'
        ? chapter.publishedAt
        : chapter.publishedAt.toISOString()
      : undefined,
  };
}

/**
 * Datos de paginación para capítulos
 */
export interface PaginatedChapterResponseDTO {
  /** Lista de capítulos */
  items: ChapterResponseDTO[] | ChapterSummaryDTO[];
  /** Total de elementos */
  total: number;
  /** Página actual */
  page: number;
  /** Elementos por página */
  limit: number;
  /** Total de páginas */
  totalPages: number;
}

/**
 * Filtros para búsqueda de capítulos
 */
export interface ChapterFiltersDTO {
  /** Filtrar por manga ID */
  mangaId?: string;
  /** Número de página */
  page?: number;
  /** Resultados por página */
  limit?: number;
  /** Ordenar por número de capítulo */
  sortByNumber?: 'asc' | 'desc';
  /** Incluir solo capítulos publicados */
  onlyPublished?: boolean;
}
