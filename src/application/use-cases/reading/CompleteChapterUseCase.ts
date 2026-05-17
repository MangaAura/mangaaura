/**
 * Caso de uso: Completar capítulo
 * Marca un capítulo como completado, agrega XP y actualiza streak de lectura
 * @packageDocumentation
 */

import { DomainError } from '../../../core/errors/DomainError';
import { IUserRepository } from '../../ports/IUserRepository';
import { IChapterRepository, ChapterNotFoundError } from '../../ports/IChapterRepository';
import { IEventBus } from '../../services/IEventBus';
import { ChapterCompletedEvent } from '../../events/ChapterCompletedEvent';
import { XPAddedEvent } from '../../events/XPAddedEvent';
import { CompleteChapterDTO, CompleteChapterResultDTO } from '../../dtos/chapter/CompleteChapterDTO';

/**
 * Puerto para registro de sesiones de lectura
 */
export interface IReadingSessionRepository {
  create(data: {
    userId: string;
    chapterId: string;
    mangaId: string;
    startTime: Date;
    endTime: Date;
    pagesRead: number;
    totalPages: number;
    completed: boolean;
  }): Promise<{
    id: string;
    userId: string;
    chapterId: string;
    createdAt: Date;
  }>;
}

/**
 * Caso de uso para completar un capítulo
 */
export class CompleteChapterUseCase {
  /** XP ganado por completar un capítulo */
  private readonly XP_PER_CHAPTER = 2;

  constructor(
    private readonly userRepo: IUserRepository,
    private readonly chapterRepo: IChapterRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Ejecuta el caso de uso
   * @param dto - Datos para completar el capítulo
   * @returns Resultado con XP ganado y streak actualizado
   * @throws DomainError si el capítulo no existe o datos inválidos
   */
  async execute(dto: CompleteChapterDTO): Promise<CompleteChapterResultDTO> {
    // Validar datos
    this.validateInput(dto);

    // Verificar que el usuario existe
    const user = await this.userRepo.findById(dto.userId);
    if (!user) {
      throw new UserNotFoundError(dto.userId);
    }

    // Verificar que el capítulo existe
    const chapter = await this.chapterRepo.findById(dto.chapterId);
    if (!chapter) {
      throw new ChapterNotFoundError(dto.chapterId);
    }

    // Guardar valores anteriores
    const previousXP = user.xp.amount;
    const previousLevel = user.xp.level;
    const previousStreak = user.readingStreak ?? 0;

    // Calcular streak actualizado
    const streakUpdate = this.calculateStreakUpdate(user.lastReadAt, previousStreak);

    // Calcular nuevo XP y nivel
    const newXP = previousXP + this.XP_PER_CHAPTER;
    const newLevel = Math.floor(newXP / 1000) + 1;

    // Actualizar usuario
    await this.userRepo.updateXP(dto.userId, this.XP_PER_CHAPTER);

    // Actualizar streak y lastReadAt
    await this.userRepo.update(dto.userId, {
      readingStreak: streakUpdate.newStreak,
      lastReadAt: new Date(),
    });

    // Incrementar contador de vistas del capítulo
    await this.chapterRepo.incrementViewCount(dto.chapterId);

    // Verificar si subió de nivel
    const levelUp = newLevel > previousLevel;

    // Publicar evento de capítulo completado
    await this.eventBus.publish(
      new ChapterCompletedEvent({
        userId: dto.userId,
        chapterId: dto.chapterId,
        mangaId: chapter.mangaId,
        chapterNumber: chapter.chapterNumber,
        xpGained: this.XP_PER_CHAPTER,
        readingStreak: streakUpdate.newStreak,
      })
    );

    // Publicar evento de XP agregado
    await this.eventBus.publish(
      new XPAddedEvent({
        userId: dto.userId,
        amount: this.XP_PER_CHAPTER,
        source: 'CHAPTER_COMPLETE',
        totalXP: newXP,
        level: newLevel,
        description: `Completó el capítulo ${chapter.chapterNumber}`,
      })
    );

    return {
      xpGained: this.XP_PER_CHAPTER,
      newLevel: levelUp ? newLevel : undefined,
      streakUpdated: {
        previous: previousStreak,
        current: streakUpdate.newStreak,
        streakIncreased: streakUpdate.increased,
      },
      levelUp,
      totalXP: newXP,
      currentLevel: newLevel,
      progressToNextLevel: this.calculateProgressToNextLevel(newXP),
    };
  }

  /**
   * Valida los datos de entrada
   * @param dto - Datos a validar
   * @throws DomainError si los datos son inválidos
   */
  private validateInput(dto: CompleteChapterDTO): void {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new ValidationError('ID de usuario requerido');
    }

    if (!dto.chapterId || dto.chapterId.trim().length === 0) {
      throw new ValidationError('ID de capítulo requerido');
    }
  }

  /**
   * Calcula la actualización del streak de lectura
   * @param lastReadAt - Fecha de última lectura
   * @param currentStreak - Streak actual
   * @returns Información de la actualización
   */
  private calculateStreakUpdate(
    lastReadAt: Date | undefined,
    currentStreak: number
  ): { newStreak: number; increased: boolean } {
    const now = new Date();

    if (!lastReadAt) {
      // Primera vez que lee
      return { newStreak: 1, increased: true };
    }

    const lastRead = new Date(lastReadAt);
    const today = new Date(now);

    // Resetear horas para comparar solo fechas
    lastRead.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastRead.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Ya leyó hoy, no incrementamos
      return { newStreak: currentStreak, increased: false };
    }

    if (diffDays === 1) {
      // Leyó ayer, incrementar streak
      return { newStreak: currentStreak + 1, increased: true };
    }

    // Se saltó días, resetear a 1
    return { newStreak: 1, increased: true };
  }

  /**
   * Calcula el progreso hacia el siguiente nivel
   * @param xp - XP total
   * @returns Porcentaje de progreso (0-100)
   */
  private calculateProgressToNextLevel(xp: number): number {
    const level = Math.floor(xp / 1000) + 1;
    const currentLevelXP = (level - 1) * 1000;
    const nextLevelXP = level * 1000;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.round(progress);
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
 * Error cuando el usuario no es encontrado
 */
class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly isOperational = true;
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}
