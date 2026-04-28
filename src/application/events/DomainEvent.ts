/**
 * Clase base para eventos de dominio
 * Los eventos de dominio representan hechos ocurridos en el sistema
 * @packageDocumentation
 */

/**
 * Evento de dominio base
 * Todos los eventos de dominio deben extender esta clase
 */
export abstract class DomainEvent {
  /**
   * Nombre único del tipo de evento
   */
  abstract readonly name: string;

  /**
   * Datos del evento (payload)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract readonly payload: any;

  /**
   * Timestamp cuando ocurrió el evento
   */
  readonly timestamp: Date;

  /**
   * ID único del evento
   */
  readonly eventId: string;

  constructor() {
    this.timestamp = new Date();
    this.eventId = crypto.randomUUID();
  }

  /**
   * Serializa el evento a un objeto JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      name: this.name,
      payload: this.payload,
      timestamp: this.timestamp.toISOString(),
    };
  }

  /**
   * Retorna una representación string del evento
   */
  toString(): string {
    return `[${this.name}] ${this.eventId} at ${this.timestamp.toISOString()}`;
  }
}

/**
 * Interfaz para manejadores de eventos
 */
export interface DomainEventHandler<T extends DomainEvent> {
  /**
   * Maneja un evento de dominio
   * @param event - Evento a manejar
   */
  handle(event: T): Promise<void>;

  /**
   * Retorna true si el manejador puede manejar el evento
   * @param eventName - Nombre del evento
   */
  canHandle(eventName: string): boolean;
}

/**
 * Metadata de un evento para almacenamiento
 */
export interface EventMetadata {
  /** ID del evento */
  eventId: string;
  /** Nombre del evento */
  name: string;
  /** Timestamp del evento */
  timestamp: Date;
  /** Payload del evento */
  payload: Record<string, unknown>;
  /** Si el evento fue procesado */
  processed: boolean;
  /** Timestamp de procesamiento */
  processedAt?: Date;
  /** Error si falló el procesamiento */
  error?: string;
}
