/**
 * Handlers de eventos de dominio
 * Registran las reacciones a los eventos del sistema
 * Se inicializan automáticamente al importar este módulo
 * @packageDocumentation
 */

import { achievementService, initializeAchievementService } from '@/core/services/AchievementService';
import { notificationService, initializeNotificationService } from '@/core/services/NotificationService';
import { readingAnalyticsService, initializeReadingAnalyticsService } from '@/core/services/ReadingAnalyticsService';
import { MongoReadingAnalyticsRepository } from '@/infrastructure/adapters/MongoReadingAnalyticsRepository';
import { PrismaAchievementRepository } from '@/infrastructure/adapters/PrismaAchievementRepository';
import { PrismaNotificationRepository, PushNotificationAdapter, RealtimeNotificationAdapter } from '@/infrastructure/adapters/PrismaNotificationRepository';
import { getEventBus, DomainEvent } from '@/infrastructure/queue/LocalEventBus';
import { prisma } from '@/lib/prisma';

// Initialize achievement service with infrastructure adapter
if (!achievementService) {
  initializeAchievementService(new PrismaAchievementRepository(prisma));
}

// Initialize notification service with infrastructure adapters
if (!notificationService) {
  initializeNotificationService(
    new PrismaNotificationRepository(),
    new PushNotificationAdapter(),
    new RealtimeNotificationAdapter()
  );
}

// Initialize reading analytics service with infrastructure adapter
if (!readingAnalyticsService) {
  initializeReadingAnalyticsService(new MongoReadingAnalyticsRepository());
}

let initialized = false;

function register(): void {
  if (initialized) return;
  initialized = true;

  const eventBus = getEventBus();

  const svc = achievementService!;

  eventBus.subscribe('CHAPTER_COMPLETED', async (event: DomainEvent) => {
    try {
      const userId = event.payload.userId as string;
      if (userId) {
        await svc.checkAchievements(userId).catch(err =>
          console.error('[DomainEvents] Error checking achievements:', err)
        );
      }
    } catch (error) {
      console.error('[DomainEvents] Error handling CHAPTER_COMPLETED:', error);
    }
  });

  eventBus.subscribe('COMMENT_POSTED', async (event: DomainEvent) => {
    try {
      const userId = event.payload.userId as string;
      if (userId) {
        await svc.checkAchievements(userId).catch(err =>
          console.error('[DomainEvents] Error checking achievements for comment:', err)
        );
      }
    } catch (error) {
      console.error('[DomainEvents] Error handling COMMENT_POSTED:', error);
    }
  });

  eventBus.subscribe('USER_REGISTERED', async (event: DomainEvent) => {
    try {
      const userId = event.payload.userId as string;
      const username = event.payload.username as string;

      if (userId) {
        await notificationService!.notifyMultiple([userId], {
          type: 'SYSTEM',
          title: '¡Bienvenido a MangaAura!',
          message: `¡Hola ${username}! Comienza tu aventura leyendo mangas y ganando XP.`,
          data: { userId },
        } as { type: 'SYSTEM'; title: string; message: string; data: Record<string, unknown> }).catch(err =>
          console.error('[DomainEvents] Error sending welcome notification:', err)
        );

        await svc.checkAchievements(userId).catch(err =>
          console.error('[DomainEvents] Error checking initial achievements:', err)
        );
      }
    } catch (error) {
      console.error('[DomainEvents] Error handling USER_REGISTERED:', error);
    }
  });

  eventBus.subscribe('LEVEL_UP', async (event: DomainEvent) => {
    try {
      const userId = event.payload.userId as string;
      const newLevel = event.payload.newLevel as number;
      const oldLevel = event.payload.oldLevel as number;

      if (userId && newLevel > oldLevel) {
        await notificationService!.notifyLevelUp(userId, oldLevel, newLevel).catch(err =>
          console.error('[DomainEvents] Error notifying level up:', err)
        );

        await svc.checkAchievements(userId).catch(err =>
          console.error('[DomainEvents] Error checking level achievements:', err)
        );
      }
    } catch (error) {
      console.error('[DomainEvents] Error handling LEVEL_UP:', error);
    }
  });

  eventBus.subscribe('ACHIEVEMENT_UNLOCKED', async (event: DomainEvent) => {
    try {
      const userId = event.payload.userId as string;
      const achievementName = event.payload.achievementName as string;

      if (userId) {
        await prisma.userActivity.create({
          data: {
            userId,
            activityType: 'ACHIEVEMENT_UNLOCKED',
            referenceId: event.payload.badgeId as string,
            metadata: JSON.stringify({ achievementName }),
          },
        }).catch(err => console.error('[DomainEvents] Error logging achievement activity:', err));
      }
    } catch (error) {
      console.error('[DomainEvents] Error handling ACHIEVEMENT_UNLOCKED:', error);
    }
  });

  eventBus.subscribe('SPONSORSHIP_BID_SUBMITTED', async (event: DomainEvent) => {
    try {
      const userId = event.payload.userId as string;
      if (userId) {
        await svc.checkAchievements(userId).catch(err =>
          console.error('[DomainEvents] Error checking sponsorship achievements:', err)
        );
      }
    } catch (error) {
      console.error('[DomainEvents] Error handling SPONSORSHIP_BID_SUBMITTED:', error);
    }
  });

  console.info('[DomainEvents] All domain event handlers registered');
}

// Auto-inicializar en server-side
if (typeof window === 'undefined') {
  register();
}

export function initializeDomainEvents(): void {
  register();
}

export function registerDomainEventHandlers(): void {
  register();
}