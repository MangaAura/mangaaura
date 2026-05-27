/**
 * useErrorHandler Hook
 *
 * Hook para manejar errores de forma consistente y amigable.
 */

import { useState, useCallback } from 'react';

import { useToast } from '@/components/ui/Toast';

export type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorState {
  message: string;
  severity: ErrorSeverity;
  code?: string;
  retry?: () => void;
}

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  onError?: (error: ErrorState) => void;
}

const getFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Mensajes específicos de errores conocidos
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    if (message.includes('timeout')) {
      return 'La solicitud tardó demasiado. Por favor, inténtalo de nuevo.';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'No tienes permiso para realizar esta acción.';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'El recurso solicitado no fue encontrado.';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Los datos proporcionados no son válidos. Por favor, verifica e inténtalo de nuevo.';
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Has realizado demasiadas solicitudes. Por favor, espera un momento.';
    }
    if (message.includes('server') || message.includes('500') || message.includes('error interno')) {
      return 'Ha ocurrido un error en el servidor. Por favor, inténtalo más tarde.';
    }
    
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.';
};

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, logToConsole = true, onError } = options;
  const [error, setError] = useState<ErrorState | null>(null);
  const { toast } = useToast();

  const handleError = useCallback(
    (err: unknown, severity: ErrorSeverity = 'error', retry?: () => void) => {
      const message = getFriendlyErrorMessage(err);
      const code = err instanceof Error ? err.name : 'UNKNOWN_ERROR';
      
      const errorState: ErrorState = {
        message,
        severity,
        code,
        retry,
      };

      setError(errorState);

      if (logToConsole) {
        console.error('[ErrorHandler]', err);
      }

      if (showToast) {
        toast({
          title: severity === 'error' ? 'Error' : severity === 'warning' ? 'Advertencia' : 'Información',
          description: message,
          variant: severity === 'error' ? 'destructive' : 'default',
        });
      }

      if (onError) {
        onError(errorState);
      }

      return errorState;
    },
    [showToast, logToConsole, onError, toast]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retry = useCallback(() => {
    if (error?.retry) {
      error.retry();
      clearError();
    }
  }, [error, clearError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    retry,
    hasError: error !== null,
    isRetryable: error?.retry !== undefined,
  };
}

/**
 * useAsyncError Hook
 *
 * Wrapper para funciones async con manejo automático de errores.
 */

interface UseAsyncErrorOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  loadingMessage?: string;
  successMessage?: string;
}

export function useAsyncError<T = unknown>() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const { handleError, clearError } = useErrorHandler();
  const { toast } = useToast();

  const execute = useCallback(
    async <R = T>(
      asyncFunction: () => Promise<R>,
      options: UseAsyncErrorOptions<R> = {}
    ): Promise<R | null> => {
      const {
        onSuccess,
        onError,
        showErrorToast = true,
        loadingMessage,
        successMessage,
      } = options;

      setIsLoading(true);
      clearError();

      try {
        if (loadingMessage) {
          toast({
            title: 'Cargando',
            description: loadingMessage,
          });
        }

        const result = await asyncFunction();
        setData(result as unknown as T);

        if (successMessage) {
          toast({
            title: 'Éxito',
            description: successMessage,
            variant: 'default',
          });
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        
        if (showErrorToast) {
          handleError(error);
        }

        if (onError) {
          onError(error);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, toast]
  );

  return {
    isLoading,
    data,
    execute,
    setData,
  };
}

export default useErrorHandler;
