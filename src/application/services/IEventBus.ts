/**
 * Interfaz del bus de eventos (Port en Clean Architecture)
 * Define el contrato para publicar y suscribir eventos de dominio
 * @packageDocumentation
 */

import { DomainEvent } from '../events/DomainEvent';

/**
 * Tipo para manejadores de eventos
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T
) => void | Promise<void>;

/**
 * Opciones de publicación de eventos
 */
export interface PublishOptions {
  /** Si el evento debe ser persistente */
  persistent?: boolean;
  /** Prioridad del evento (1-10) */
  priority?: number;
  /** Retraso en milisegundos antes de procesar */
  delay?: number;
  /** Número máximo de reintentos si falla */
  maxRetries?: number;
}

/**
 * Opciones de suscripción
 */
export interface SubscribeOptions {
  /** Si la suscripción debe ser persistente */
  persistent?: boolean;
  /** Si el handler debe ejecutarse una sola vez */
  once?: boolean;
  /** Prioridad del handler (mayor número = mayor prioridad) */
  priority?: number;
}

/**
 * Información de una suscripción
 */
export interface Subscription {
  /** ID de la suscripción */
  id: string;
  /** Nombre del evento */
  eventName: string;
  /** Handler suscrito */
  handler: EventHandler;
  /** Opciones de suscripción */
  options: SubscribeOptions;
  /** Timestamp de creación */
  createdAt: Date;
}

/**
 * Estadísticas del bus de eventos
 */
export interface EventBusStats {
  /** Total de eventos publicados */
  totalPublished: number;
  /** Total de eventos procesados */
  totalProcessed: number;
  /** Total de eventos fallidos */
  totalFailed: number;
  /** Total de suscripciones activas */
  activeSubscriptions: number;
  /** Eventos por nombre (top 10) */
  eventsByName: Record<string, number>;
}

/**
 * Interfaz del bus de eventos
 * Implementa el patrón Observer para eventos de dominio
 */
export interface IEventBus {
  /**
   * Publica un evento en el bus
   * @param event - Evento a publicar
   * @param options - Opciones de publicación
   * @returns Promise que se resuelve cuando el evento ha sido publicado
   */
  publish<T extends DomainEvent>(
    event: T,
    options?: PublishOptions
  ): Promise<void>;

  /**
   * Publica múltiples eventos en batch
   * @param events - Array de eventos a publicar
   * @param options - Opciones de publicación
   * @returns Promise que se resuelve cuando todos los eventos han sido publicados
   */
  publishBatch<T extends DomainEvent>(
    events: T[],
    options?: PublishOptions
  ): Promise<void>;

  /**
   * Suscribe un handler a un tipo de evento
   * @param eventName - Nombre del evento a escuchar
   * @param handler - Función que manejará el evento
   * @param options - Opciones de suscripción
   * @returns ID de la suscripción
   */
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): string;

  /**
   * Suscribe un handler a múltiples tipos de eventos
   * @param eventNames - Nombres de los eventos a escuchar
   * @param handler - Función que manejará los eventos
   * @param options - Opciones de suscripción
   * @returns IDs de las suscripciones
   */
  subscribeToMany<T extends DomainEvent>(
    eventNames: string[],
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): string[];

  /**
   * Cancela una suscripción
   * @param subscriptionId - ID de la suscripción a cancelar
   * @returns true si se canceló exitosamente, false si no existía
   */
  unsubscribe(subscriptionId: string): boolean;

  /**
   * Cancela todas las suscripciones de un evento
   * @param eventName - Nombre del evento
   * @returns Número de suscripciones canceladas
   */
  unsubscribeAll(eventName: string): number;

  /**
   * Obtiene todas las suscripciones activas
   * @returns Array de suscripciones
   */
  getSubscriptions(): Subscription[];

  /**
   * Obtiene las suscripciones de un evento específico
   * @param eventName - Nombre del evento
   * @returns Array de suscripciones
   */
  getSubscriptionsForEvent(eventName: string): Subscription[];

  /**
   * Verifica si hay suscripciones para un evento
   * @param eventName - Nombre del evento
   * @returns true si hay suscriptores, false en caso contrario
   */
  hasSubscribers(eventName: string): boolean;

  /**
   * Espera a que todos los eventos pendientes sean procesados
   * @param timeout - Timeout en ms (por defecto: 5000)
   * @returns Promise que se resuelve cuando los eventos están procesados
   */
  waitForPendingEvents(timeout?: number): Promise<void>;

  /**
   * Limpia todos los eventos y suscripciones
   * Útil para testing
   */
  clear(): void;

  /**
   * Obtiene estadísticas del bus de eventos
   * @returns Estadísticas actuales
   */
  getStats(): EventBusStats;

  /**
   * Inicializa el bus de eventos
   * Configuración inicial, conexiones, etc.
   */
  initialize?(): Promise<void>;

  /**
   * Cierra el bus de eventos
   * Limpia recursos, cierra conexiones
   */
  dispose?(): Promise<void>;
}

/**
 * Error del bus de eventos
 */
export class EventBusError extends Error {
  readonly code: string;
  readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'EventBusError';
    this.code = code;
    this.isOperational = isOperational;
  }
}

/**
 * Error de timeout al esperar eventos
 */
export class EventBusTimeoutError extends EventBusError {
  constructor(timeout: number) {
    super(
      `Timeout esperando eventos después de ${timeout}ms`,
      'EVENT_BUS_TIMEOUT',
      true
    );
  }
}

/**
 * Error de handler fallido
 */
export class EventHandlerError extends EventBusError {
  readonly originalError: Error;
  readonly eventName: string;

  constructor(eventName: string, originalError: Error) {
    super(
      `Error en handler de evento ${eventName}: ${originalError.message}`,
      'EVENT_HANDLER_ERROR',
      true
    );
    this.originalError = originalError;
    this.eventName = eventName;
  }
}
