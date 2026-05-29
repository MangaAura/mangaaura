/**
 * Socket.IO Server Configuration (STUB)
 *
 * WebSockets fueron removidos. Este archivo es un stub que mantiene
 * compatibilidad con el código existente. getIO() siempre retorna null.
 * Las funciones emit* son no-ops.
 */

// Re-exportar tipos para mantener compatibilidad
export * from '@/types/socket';

// Singleton (siempre null)
export type IOServer = null;

export const getIO = (): null => null;

export const initIO = (): null => {
  console.info('[Socket] WebSockets disabled — running in HTTP-only mode');
  return null;
};

/** No-op: WebSockets están deshabilitados */
export const emitNotification = (
  _userId: string,
  _notification: unknown,
) => {
  // No-op
};

/** No-op: WebSockets están deshabilitados */
export const emitToRoom = (
  _room: string,
  _event: string,
  _data: unknown,
) => {
  // No-op
};

/** No-op: WebSockets están deshabilitados */
export const broadcastNotification = (
  _event: string,
  _data: unknown,
) => {
  // No-op
};
