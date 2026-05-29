/**
 * useSocket Hook (NOOP)
 *
 * WebSockets fueron removidos. Este hook es un stub que retorna
 * valores por defecto para mantener compatibilidad con el resto del código.
 * Toda la comunicación en tiempo real se maneja vía polling HTTP.
 */

'use client';

import { useCallback } from 'react';

export function useSocket(_options?: Record<string, unknown>) {
  const joinRoom = useCallback((_room: string) => {}, []);
  const leaveRoom = useCallback((_room: string) => {}, []);
  const emit = useCallback(<T extends string>(_event: T, ..._args: unknown[]) => {}, []);
  const on = useCallback(<T extends string>(_event: T, _callback: (...args: unknown[]) => void) => {
    // Devuelve un cleanup noop para compatibilidad con el patrón useEffect
    return () => {};
  }, []);

  return {
    socket: null,
    isConnected: false,
    transport: 'N/A',
    error: null,
    joinRoom,
    leaveRoom,
    emit,
    on,
  };
}

export default useSocket;
