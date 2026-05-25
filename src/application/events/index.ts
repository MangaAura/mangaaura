/**
 * Re-exporta eventos de dominio desde core/events
 * Los eventos de dominio viven en core/events/ (capa de dominio)
 */

export * from '@/core/events/DomainEvent';
export * from '@/core/events/UserRegisteredEvent';
export * from '@/core/events/ChapterCompletedEvent';
export * from '@/core/events/XPAddedEvent';
export * from '@/core/events/CommentPostedEvent';
export * from '@/core/events/AuraSpentEvent';
export * from '@/core/events/MangaEvents';
