/**
 * Servicio de Logros (Achievements)
 * Gestiona la verificación, desbloqueo y progreso de logros
 * @packageDocumentation
 */

import { PrismaClient, Prisma, type AchievementDefinition } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { notificationService } from './NotificationService';

/**
 * Condición de logro tipada
 */
export interface AchievementCondition {
  type: 'CHAPTERS_READ' | 'COMMENTS_POSTED' | 'CORRECTIONS_APPROVED' | 
        'MANGAS_COMPLETED' | 'COMMENT_LIKES_RECEIVED' | 'MANGAS_CREATED' | 
        'SPONSORSHIPS_WON' | 'LEVEL_REACHED';
  count?: number;
  level?: number;
}

/**
 * Logro con metadata
 */
export interface Achievement {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl: string | null;
  condition: AchievementCondition;
  category: string;
  difficulty: string;
  createdAt: Date;
}

/**
 * Logro del usuario con estado
 */
export interface UserAchievement {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  xpReward: number;
  iconUrl: string | null;
  condition: AchievementCondition;
  category: string;
  difficulty: string;
  unlockedAt: Date | null;
  progress: number;
  target: number;
  isUnlocked: boolean;
}

/**
 * Evento de logro desbloqueado
 */
export interface AchievementUnlockedEvent {
  userId: string;
  badgeId: string;
  achievementName: string;
  xpReward: number;
  unlockedAt: Date;
}

/**
 * Listener para eventos de logros
 */
export type AchievementListener = (event: AchievementUnlockedEvent) => void | Promise<void>;

/**
 * Servicio principal de logros
 */
export class AchievementService {
  private listeners: AchievementListener[] = [];
  private xpService: { addXP: (userId: string, amount: number, source: string, description?: string) => Promise<void> } | null = null;

  constructor(
    private readonly prismaClient: PrismaClient = prisma,
    xpService?: { addXP: (userId: string, amount: number, source: string, description?: string) => Promise<void> }
  ) {
    if (xpService) {
      this.xpService = xpService;
    }
  }

  /**
   * Registra un listener para eventos de logros
   */
  onAchievementUnlocked(listener: AchievementListener): void {
    this.listeners.push(listener);
  }

  /**
   * Notifica a todos los listeners
   */
  private async notifyListeners(event: AchievementUnlockedEvent): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error('Error en listener de logros:', error);
      }
    }
  }

  /**
   * Verifica todos los logros para un usuario
   * @param userId - ID del usuario
   * @returns Lista de logros desbloqueados
   */
  async checkAchievements(userId: string): Promise<AchievementUnlockedEvent[]> {
    const achievements = await this.getAllAchievements();
    const unlocked: AchievementUnlockedEvent[] = [];

    for (const achievement of achievements) {
      const isAlreadyUnlocked = await this.isAchievementUnlocked(userId, achievement.id);
      if (!isAlreadyUnlocked) {
        const shouldUnlock = await this.checkAchievementCondition(userId, achievement.condition);
        if (shouldUnlock) {
          const event = await this.unlockAchievement(userId, achievement.badgeId);
          if (event) {
            unlocked.push(event);
          }
        }
      }
    }

    return unlocked;
  }

  /**
   * Verifica un logro específico
   * @param userId - ID del usuario
   * @param badgeId - ID del badge del logro
   * @returns true si el logro debe desbloquearse
   */
  async checkAchievement(userId: string, badgeId: string): Promise<boolean> {
    const achievement = await this.getAchievementByBadgeId(badgeId);
    if (!achievement) {
      throw new Error(`Logro no encontrado: ${badgeId}`);
    }

    const isAlreadyUnlocked = await this.isAchievementUnlocked(userId, achievement.id);
    if (isAlreadyUnlocked) {
      return false;
    }

    return this.checkAchievementCondition(userId, achievement.condition);
  }

  /**
   * Desbloquea un logro y otorga XP
   * @param userId - ID del usuario
   * @param badgeId - ID del badge del logro
   * @returns Evento de logro desbloqueado o null
   */
  async unlockAchievement(userId: string, badgeId: string): Promise<AchievementUnlockedEvent | null> {
    const achievement = await this.getAchievementByBadgeId(badgeId);
    if (!achievement) {
      throw new Error(`Logro no encontrado: ${badgeId}`);
    }

    // Verificar si ya está desbloqueado
    const existing = await this.prismaClient.userAchievement.findFirst({
      where: {
        userId,
        achievementId: achievement.id,
      },
    });

    if (existing) {
      return null;
    }

    // Desbloquear el logro
    await this.prismaClient.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
      },
    });

    // Agregar XP
    if (this.xpService) {
      await this.xpService.addXP(
        userId,
        achievement.xpReward,
        'ACHIEVEMENT_UNLOCKED',
        `Logro desbloqueado: ${achievement.name}`
      );
    }

    // Crear evento
    const event: AchievementUnlockedEvent = {
      userId,
      badgeId: achievement.badgeId,
      achievementName: achievement.name,
      xpReward: achievement.xpReward,
      unlockedAt: new Date(),
    };

    // Notificar listeners
    await this.notifyListeners(event);

    // Crear notificacion push
    try {
      const achievementData: AchievementDefinition = {
        id: achievement.id,
        badgeId: achievement.badgeId,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: JSON.stringify(achievement.condition),
        category: achievement.category,
        difficulty: achievement.difficulty || 'EASY',
        createdAt: achievement.createdAt,
      };
      await notificationService.notifyAchievementUnlocked(userId, achievementData);
    } catch (notifyError) {
      console.error('Error sending achievement notification:', notifyError);
    }

    // Enviar email de logro desbloqueado
    try {
      const { getEmailQueue } = await import('@/infrastructure/queue/EmailQueue');
      const emailQueue = getEmailQueue();

      const user = await this.prismaClient.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });

      if (user) {
        await emailQueue.addAchievementEmail({
          to: user.email,
          userId,
          username: user.username,
          achievementId: achievement.id,
          achievementName: achievement.name,
          achievementDescription: achievement.description,
          achievementIconUrl: achievement.iconUrl,
          xpReward: achievement.xpReward,
        });
      }
    } catch (emailError) {
      console.error('Error queueing achievement email:', emailError);
    }

    return event;
  }

  /**
   * Obtiene todos los logros del sistema
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const achievements = await this.prismaClient.achievementDefinition.findMany({
      orderBy: [
        { category: 'asc' },
        { xpReward: 'asc' },
      ],
    });

    return achievements.map(this.mapToAchievement);
  }

  /**
   * Obtiene un logro por su badgeId
   */
  async getAchievementByBadgeId(badgeId: string): Promise<Achievement | null> {
    const achievement = await this.prismaClient.achievementDefinition.findUnique({
      where: { badgeId },
    });

    if (!achievement) return null;

    return this.mapToAchievement(achievement);
  }

  /**
   * Obtiene los logros de un usuario con progreso
   * @param userId - ID del usuario
   * @returns Lista de logros con estado
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const [allAchievements, userAchievements, stats] = await Promise.all([
      this.getAllAchievements(),
      this.prismaClient.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      this.getUserStats(userId),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua: any) => ua.achievementId));

    return allAchievements.map((achievement: any) => {
      const isUnlocked = unlockedIds.has(achievement.id);
      const progress = this.calculateProgress(achievement.condition, stats);
      const target = this.getTarget(achievement.condition);

      return {
        id: achievement.id,
        badgeId: achievement.badgeId,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        iconUrl: achievement.iconUrl,
        condition: achievement.condition,
        category: achievement.category,
        difficulty: achievement.difficulty,
        unlockedAt: isUnlocked ? userAchievements.find((ua: any) => ua.achievementId === achievement.id)?.unlockedAt ?? null : null,
        progress: Math.min(progress, target),
        target,
        isUnlocked,
      };
    });
  }

  /**
   * Obtiene los logros desbloqueados de un usuario
   */
  async getUnlockedAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievements = await this.getUserAchievements(userId);
    return userAchievements.filter(ua => ua.isUnlocked);
  }

  /**
   * Obtiene el total de XP ganada por logros
   */
  async getTotalXPEarned(userId: string): Promise<number> {
    const userAchievements = await this.prismaClient.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    return userAchievements.reduce((total: any, ua: any) => total + ua.achievement.xpReward, 0);
  }

  /**
   * Verifica si un logro está desbloqueado
   */
  private async isAchievementUnlocked(userId: string, achievementId: string): Promise<boolean> {
    const count = await this.prismaClient.userAchievement.count({
      where: {
        userId,
        achievementId,
      },
    });
    return count > 0;
  }

  /**
   * Verifica una condición de logro específica
   */
  private async checkAchievementCondition(
    userId: string,
    condition: AchievementCondition
  ): Promise<boolean> {
    const stats = await this.getUserStats(userId);

    switch (condition.type) {
      case 'CHAPTERS_READ':
        return stats.chaptersRead >= (condition.count || 1);

      case 'COMMENTS_POSTED':
        return stats.commentsPosted >= (condition.count || 1);

      case 'CORRECTIONS_APPROVED':
        return stats.correctionsApproved >= (condition.count || 1);

      case 'MANGAS_COMPLETED':
        return stats.mangasCompleted >= (condition.count || 1);

      case 'COMMENT_LIKES_RECEIVED':
        return stats.commentLikesReceived >= (condition.count || 1);

      case 'MANGAS_CREATED':
        return stats.mangasCreated >= (condition.count || 1);

      case 'SPONSORSHIPS_WON':
        return stats.sponsorshipsWon >= (condition.count || 1);

      case 'LEVEL_REACHED':
        return stats.currentLevel >= (condition.level || 1);

      default:
        return false;
    }
  }

  /**
   * Obtiene las estadísticas del usuario
   */
  private async getUserStats(userId: string): Promise<{
    chaptersRead: number;
    commentsPosted: number;
    correctionsApproved: number;
    mangasCompleted: number;
    commentLikesReceived: number;
    mangasCreated: number;
    sponsorshipsWon: number;
    currentLevel: number;
  }> {
    const [
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      user,
    ] = await Promise.all([
      // Capítulos leídos (sesiones completadas)
      this.prismaClient.readingSession.count({
        where: { userId },
      }),

      // Comentarios publicados
      this.prismaClient.comment.count({
        where: { userId },
      }),

      // Correcciones aprobadas
      this.prismaClient.chapterCorrection.count({
        where: { 
          userId,
          status: 'APPROVED',
        },
      }),

      // Mangas completados
      this.prismaClient.userManga.count({
        where: { 
          userId,
          status: 'COMPLETED',
        },
      }),

      // Likes recibidos en comentarios
      this.prismaClient.commentLike.count({
        where: {
          comment: { userId },
        },
      }),

      // Mangas creados
      this.prismaClient.mangaSeries.count({
        where: { authorId: userId },
      }),

      // Patrocinios ganados
      this.prismaClient.sponsorshipBid.count({
        where: {
          userId,
          isWinning: true,
        },
      }),

      // Nivel actual del usuario
      this.prismaClient.user.findUnique({
        where: { id: userId },
        select: { level: true },
      }),
    ]);

    return {
      chaptersRead,
      commentsPosted,
      correctionsApproved,
      mangasCompleted,
      commentLikesReceived,
      mangasCreated,
      sponsorshipsWon,
      currentLevel: user?.level || 1,
    };
  }

  /**
   * Calcula el progreso hacia un logro
   */
  private calculateProgress(
    condition: AchievementCondition,
    stats: ReturnType<typeof this.getUserStats> extends Promise<infer T> ? T : never
  ): number {
    switch (condition.type) {
      case 'CHAPTERS_READ':
        return stats.chaptersRead;
      case 'COMMENTS_POSTED':
        return stats.commentsPosted;
      case 'CORRECTIONS_APPROVED':
        return stats.correctionsApproved;
      case 'MANGAS_COMPLETED':
        return stats.mangasCompleted;
      case 'COMMENT_LIKES_RECEIVED':
        return stats.commentLikesReceived;
      case 'MANGAS_CREATED':
        return stats.mangasCreated;
      case 'SPONSORSHIPS_WON':
        return stats.sponsorshipsWon;
      case 'LEVEL_REACHED':
        return stats.currentLevel;
      default:
        return 0;
    }
  }

  /**
   * Obtiene el objetivo de una condición
   */
  private getTarget(condition: AchievementCondition): number {
    if ('count' in condition && condition.count !== undefined) {
      return condition.count;
    }
    if ('level' in condition && condition.level !== undefined) {
      return condition.level;
    }
    return 1;
  }

  /**
   * Mapea un registro de Prisma a Achievement
   */
  private mapToAchievement(
    data: Prisma.AchievementDefinitionGetPayload<{}>
  ): Achievement {
    return {
      id: data.id,
      badgeId: data.badgeId,
      name: data.name,
      description: data.description,
      xpReward: data.xpReward,
      iconUrl: data.iconUrl,
      condition: JSON.parse(data.condition) as AchievementCondition,
      category: (data as unknown as { category?: string }).category || 'MILESTONE',
      difficulty: (data as unknown as { difficulty?: string }).difficulty || 'MEDIUM',
      createdAt: data.createdAt,
    };
  }
}

// Instancia singleton para uso en la aplicación
export const achievementService = new AchievementService();

export default AchievementService;
