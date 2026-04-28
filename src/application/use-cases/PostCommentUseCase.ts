/**
 * Caso de uso: Publicar un comentario
 * Agrega un comentario a un capítulo y otorga XP al usuario
 * @packageDocumentation
 */

import { DomainError } from '../../core/errors/DomainError';
import { IEventBus } from '../services/IEventBus';
import { CommentPostedEvent } from '../events/CommentPostedEvent';
import { IAProvider } from '../../core/services/IAProvider';

/**
 * DTO de entrada para publicar un comentario
 */
export interface PostCommentInputDTO {
  /** ID del usuario que publica el comentario */
  userId: string;
  /** ID del capítulo donde se publica */
  chapterId: string;
  /** Contenido del comentario */
  content: string;
  /** ID del comentario padre (para respuestas, opcional) */
  parentId?: string;
}

/**
 * DTO de salida con el comentario creado
 */
export interface PostCommentOutputDTO {
  /** ID del comentario creado */
  id: string;
  /** ID del usuario */
  userId: string;
  /** ID del capítulo */
  chapterId: string;
  /** Contenido del comentario */
  content: string;
  /** ID del comentario padre (si es respuesta) */
  parentId?: string;
  /** Análisis de spoiler */
  spoilerAnalysis: {
    containsSpoiler: boolean;
    confidence: number;
  };
  /** XP ganado por comentar */
  xpGained: number;
  /** Fecha de creación */
  createdAt: string;
}

/**
 * Puerto del repositorio de comentarios
 */
export interface ICommentRepository {
  create(data: {
    userId: string;
    chapterId: string;
    content: string;
    parentId?: string;
    containsSpoiler?: boolean;
    spoilerConfidence?: number;
  }): Promise<{
    id: string;
    userId: string;
    chapterId: string;
    content: string;
    parentId?: string;
    createdAt: Date;
  }>;
}

/**
 * Puerto del repositorio de usuarios (versión mínima)
 */
export interface IUserRepositoryPort {
  findById(id: string): Promise<{
    id: string;
    xp: { amount: number };
  } | null>;
  updateXP(userId: string, amount: number): Promise<number>;
}

/**
 * Caso de uso para publicar un comentario
 */
export class PostCommentUseCase {
  private readonly MAX_CONTENT_LENGTH = 1000;
  private readonly XP_PER_COMMENT = 5;

  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly userRepo: IUserRepositoryPort,
    private readonly eventBus: IEventBus,
    private readonly aiProvider: IAProvider
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param input - Datos del comentario a publicar
   * @returns El comentario creado con análisis
   * @throws DomainError si los datos son inválidos
   */
  async execute(input: PostCommentInputDTO): Promise<PostCommentOutputDTO> {
    // Validar datos de entrada
    this.validateInput(input);

    // Verificar que el usuario existe
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    // Analizar contenido con IA para detectar spoilers
    const spoilerAnalysis = await this.analyzeSpoiler(input.content);

    // Crear el comentario
    const comment = await this.commentRepo.create({
      userId: input.userId,
      chapterId: input.chapterId,
      content: input.content,
      parentId: input.parentId,
      containsSpoiler: spoilerAnalysis.containsSpoiler,
      spoilerConfidence: spoilerAnalysis.confidence,
    });

    // Agregar XP al usuario
    await this.userRepo.updateXP(input.userId, this.XP_PER_COMMENT);

    // Publicar evento de comentario publicado
    await this.eventBus.publish(
      new CommentPostedEvent({
        userId: input.userId,
        chapterId: input.chapterId,
        commentId: comment.id,
        containsSpoiler: spoilerAnalysis.containsSpoiler,
        xpGained: this.XP_PER_COMMENT,
      })
    );

    return {
      id: comment.id,
      userId: comment.userId,
      chapterId: comment.chapterId,
      content: comment.content,
      parentId: comment.parentId,
      spoilerAnalysis,
      xpGained: this.XP_PER_COMMENT,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  /**
   * Valida los datos de entrada
   * @param input - Datos a validar
   * @throws DomainError si los datos son inválidos
   */
  private validateInput(input: PostCommentInputDTO): void {
    if (!input.userId || input.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (!input.chapterId || input.chapterId.trim().length === 0) {
      throw new ValidationError('ID de capítulo requerido');
    }

    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError('Contenido del comentario requerido');
    }

    if (input.content.length > this.MAX_CONTENT_LENGTH) {
      throw new ValidationError(
        `El contenido no puede exceder ${this.MAX_CONTENT_LENGTH} caracteres`
      );
    }

    if (input.parentId !== undefined && input.parentId.trim().length === 0) {
      throw new ValidationError('ID de comentario padre inválido');
    }
  }

  /**
   * Analiza el contenido con IA para detectar spoilers
   * @param content - Contenido del comentario
   * @returns Análisis de spoiler
   */
  private async analyzeSpoiler(content: string): Promise<{
    containsSpoiler: boolean;
    confidence: number;
  }> {
    try {
      // Usar el IAProvider para analizar el comentario
      const analysis = await this.aiProvider.analyzeComment(content);
      
      // Si el score de spoiler es mayor a 50, consideramos que contiene spoiler
      return {
        containsSpoiler: analysis.spoilerScore > 50,
        confidence: analysis.spoilerScore / 100, // Normalizar a 0-1
      };
    } catch {
      // Si falla el análisis de IA, retornar valores por defecto
      return {
        containsSpoiler: false,
        confidence: 0,
      };
    }
  }
}

/**
 * Error de validación
 */
class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error lanzado cuando el usuario no es encontrado
 */
class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}
