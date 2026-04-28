/**
 * Interfaz del repositorio de capítulos (Port en Clean Architecture)
 * Define el contrato que debe implementar cualquier adaptador de persistencia
 * @packageDocumentation
 */

/**
 * Entidad Chapter del dominio
 */
export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title?: string;
  totalPages: number;
  pageUrls: string[];
  viewCount: number;
  isCrowdfunded: boolean;
  crowdfundingGoal?: number;
  crowdfundingCurrent?: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filtros para búsqueda de capítulos
 */
export interface ChapterFilters {
  /** ID del manga */
  mangaId?: string;
  /** Número de página */
  page?: number;
  /** Resultados por página */
  limit?: number;
  /** Ordenar por número de capítulo */
  orderByChapterNumber?: 'asc' | 'desc';
  /** Solo capítulos publicados */
  onlyPublished?: boolean;
}

/**
 * Interfaz del puerto de repositorio de capítulos
 * Esta interfaz debe ser implementada por los adaptadores de infraestructura
 */
export interface IChapterRepository {
  /**
   * Busca un capítulo por su ID
   * @param id - ID del capítulo
   * @returns El capítulo encontrado o null
   */
  findById(id: string): Promise<Chapter | null>;

  /**
   * Busca capítulos por manga ID
   * @param mangaId - ID del manga
   * @returns Array de capítulos del manga
   */
  findByMangaId(mangaId: string): Promise<Chapter[]>;

  /**
   * Busca un capítulo específico por manga y número de capítulo
   * @param mangaId - ID del manga
   * @param chapterNumber - Número del capítulo
   * @returns El capítulo encontrado o null
   */
  findByMangaIdAndNumber(mangaId: string, chapterNumber: number): Promise<Chapter | null>;

  /**
   * Busca capítulos con filtros opcionales
   * @param filters - Filtros de búsqueda
   * @returns Array de capítulos que coinciden con los filtros
   */
  findAll(filters?: ChapterFilters): Promise<Chapter[]>;

  /**
   * Crea un nuevo capítulo
   * @param data - Datos del capítulo a crear
   * @returns El capítulo creado
   */
  create(data: {
    mangaId: string;
    chapterNumber: number;
    title?: string;
    totalPages: number;
    pageUrls: string[];
    isCrowdfunded?: boolean;
    crowdfundingGoal?: number;
    publishedAt?: Date;
  }): Promise<Chapter>;

  /**
   * Actualiza un capítulo existente
   * @param id - ID del capítulo
   * @param data - Datos a actualizar
   * @returns El capítulo actualizado
   * @throws Error si el capítulo no existe
   */
  update(id: string, data: {
    title?: string;
    pageUrls?: string[];
    totalPages?: number;
    isCrowdfunded?: boolean;
    crowdfundingGoal?: number;
    crowdfundingCurrent?: number;
    publishedAt?: Date;
  }): Promise<Chapter>;

  /**
   * Elimina un capítulo por su ID
   * @param id - ID del capítulo
   * @throws Error si el capítulo no existe
   */
  delete(id: string): Promise<void>;

  /**
   * Incrementa el contador de vistas del capítulo
   * @param id - ID del capítulo
   * @returns Nuevo total de vistas
   */
  incrementViewCount(id: string): Promise<number>;

  /**
   * Obtiene el último capítulo de un manga
   * @param mangaId - ID del manga
   * @returns El último capítulo o null
   */
  getLastChapter(mangaId: string): Promise<Chapter | null>;

  /**
   * Obtiene el siguiente capítulo
   * @param mangaId - ID del manga
   * @param currentChapterNumber - Número de capítulo actual
   * @returns El siguiente capítulo o null
   */
  getNextChapter(mangaId: string, currentChapterNumber: number): Promise<Chapter | null>;

  /**
   * Obtiene el capítulo anterior
   * @param mangaId - ID del manga
   * @param currentChapterNumber - Número de capítulo actual
   * @returns El capítulo anterior o null
   */
  getPreviousChapter(mangaId: string, currentChapterNumber: number): Promise<Chapter | null>;

  /**
   * Verifica si existe un capítulo con el número dado en el manga
   * @param mangaId - ID del manga
   * @param chapterNumber - Número de capítulo a verificar
   * @returns true si existe, false en caso contrario
   */
  existsByNumber(mangaId: string, chapterNumber: number): Promise<boolean>;

  /**
   * Obtiene la cantidad de capítulos de un manga
   * @param mangaId - ID del manga
   * @returns Número de capítulos
   */
  countByMangaId(mangaId: string): Promise<number>;

  /**
   * Obtiene el total de capítulos
   * @returns Número total de capítulos
   */
  count(): Promise<number>;

  /**
   * Añade contribución al crowdfunding de un capítulo
   * @param id - ID del capítulo
   * @param amount - Monto a agregar
   * @returns Monto total recaudado
   */
  addCrowdfundingContribution(id: string, amount: number): Promise<number>;
}

/**
 * Error lanzado cuando un capítulo no es encontrado
 */
export class ChapterNotFoundError extends Error {
  readonly code = 'CHAPTER_NOT_FOUND';
  readonly isOperational = true;
  constructor(identifier: string) {
    super(`Capítulo no encontrado: ${identifier}`);
    this.name = 'ChapterNotFoundError';
  }
}

/**
 * Error lanzado cuando el número de capítulo ya existe en el manga
 */
export class ChapterNumberAlreadyExistsError extends Error {
  readonly code = 'CHAPTER_NUMBER_EXISTS';
  readonly isOperational = true;
  constructor(mangaId: string, chapterNumber: number) {
    super(`Ya existe el capítulo ${chapterNumber} en el manga ${mangaId}`);
    this.name = 'ChapterNumberAlreadyExistsError';
  }
}

/**
 * Error lanzado cuando un manga no tiene capítulos
 */
export class NoChaptersFoundError extends Error {
  readonly code = 'NO_CHAPTERS_FOUND';
  readonly isOperational = true;
  constructor(mangaId: string) {
    super(`No se encontraron capítulos para el manga: ${mangaId}`);
    this.name = 'NoChaptersFoundError';
  }
}
