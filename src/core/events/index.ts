/**
 * Eventos de dominio - Barrel export
 * @packageDocumentation
 */

export { registerDomainEventHandlers, initializeDomainEvents } from './handlers';

// Re-export de events de la capa de aplicación para acceso unificado
export { DomainEvent } from '@/application/events/DomainEvent';
export type { DomainEventHandler, EventMetadata } from '@/application/events/DomainEvent';

export {
  UserRegisteredEvent,
  UserVerifiedEvent,
  UserProfileUpdatedEvent,
} from '@/application/events/UserRegisteredEvent';

export {
  ChapterCompletedEvent,
  ReadingSessionCreatedEvent,
  ReadingStreakUpdatedEvent,
} from '@/application/events/ChapterCompletedEvent';

export {
  XPAddedEvent,
  LevelUpEvent,
  RankAchievedEvent,
  RANKS,
  getRankForLevel,
} from '@/application/events/XPAddedEvent';

export {
  CommentPostedEvent,
  CommentMarkedAsSpoilerEvent,
  CommentReportedEvent,
  CommentDeletedEvent,
} from '@/application/events/CommentPostedEvent';

export {
  InkCoinsSpentEvent,
  InkCoinsReceivedEvent,
  AuthorEarningsEvent,
  CrowdfundingContributionEvent,
  CrowdfundingGoalReachedEvent,
} from '@/application/events/InkCoinsSpentEvent';

export {
  MangaCreatedEvent,
  MangaUpdatedEvent,
  ChapterPublishedEvent,
  MangaStatusChangedEvent,
  MangaFavoritedEvent,
  MangaRatedEvent,
} from '@/application/events/MangaEvents';