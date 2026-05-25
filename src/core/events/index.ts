export { registerDomainEventHandlers, initializeDomainEvents } from './handlers';

export { DomainEvent } from './DomainEvent';
export type { DomainEventHandler, EventMetadata } from './DomainEvent';

export {
  UserRegisteredEvent,
  UserVerifiedEvent,
  UserProfileUpdatedEvent,
} from './UserRegisteredEvent';

export {
  ChapterCompletedEvent,
  ReadingSessionCreatedEvent,
  ReadingStreakUpdatedEvent,
} from './ChapterCompletedEvent';

export {
  XPAddedEvent,
  LevelUpEvent,
  RankAchievedEvent,
  RANKS,
  getRankForLevel,
} from './XPAddedEvent';

export {
  CommentPostedEvent,
  CommentMarkedAsSpoilerEvent,
  CommentReportedEvent,
  CommentDeletedEvent,
} from './CommentPostedEvent';

export {
  AuraSpentEvent,
  AuraReceivedEvent,
  AuthorEarningsEvent,
  CrowdfundingContributionEvent,
  CrowdfundingGoalReachedEvent,
} from './AuraSpentEvent';

export {
  MangaCreatedEvent,
  MangaUpdatedEvent,
  ChapterPublishedEvent,
  MangaStatusChangedEvent,
  MangaFavoritedEvent,
  MangaRatedEvent,
} from './MangaEvents';