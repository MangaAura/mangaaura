/**
 * extractApiError
 *
 * Helper para extraer mensajes de error de respuestas HTTP de forma consistente.
 * Normaliza diferentes formatos de error del backend en un string amigable.
 */

interface ExtractedError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * Extrae el mensaje de error de una respuesta HTTP.
 * Soporta múltiples formatos de respuesta del backend.
 */
export async function extractApiError(response: Response): Promise<ExtractedError> {
  const status = response.status;

  try {
    const body = await response.json();

    // Formato 1: { error: "mensaje" }
    if (typeof body.error === 'string') {
      return {
        message: body.error,
        status,
        code: body.code || body.errorCode,
        details: body.details,
      };
    }

    // Formato 2: { message: "mensaje" }
    if (typeof body.message === 'string') {
      return {
        message: body.message,
        status,
        code: body.code || body.errorCode,
        details: body.details,
      };
    }

    // Formato 3: { errors: { campo: ["error1", "error2"] } }
    if (body.errors && typeof body.errors === 'object') {
      const firstError = Object.values(body.errors).flat().filter(Boolean)[0];
      return {
        message: firstError || 'Error de validación',
        status,
        code: 'VALIDATION_ERROR',
        details: body.errors as Record<string, string[]>,
      };
    }

    // Formato 4: array de errores
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      return {
        message: body.errors[0].message || body.errors[0],
        status,
        code: body.errors[0].code,
      };
    }

    // Fallback: status text genérico
    return {
      message: getDefaultErrorMessage(status),
      status,
    };
  } catch {
    // No se pudo parsear JSON
    return {
      message: getDefaultErrorMessage(status),
      status,
    };
  }
}

/**
 * Obtiene un mensaje de error por defecto basado en el código HTTP.
 */
export function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Solicitud inválida. Verifica los datos e inténtalo de nuevo.',
    401: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
    403: 'No tienes permiso para realizar esta acción.',
    404: 'El recurso solicitado no fue encontrado.',
    409: 'Conflicto. El recurso ya existe o hay un estado inconsistente.',
    413: 'El archivo es demasiado grande.',
    422: 'Los datos proporcionados no son válidos.',
    429: 'Has realizado demasiadas solicitudes. Espera un momento.',
    500: 'Ha ocurrido un error en el servidor. Inténtalo más tarde.',
    502: 'El servidor no está disponible temporalmente.',
    503: 'El servicio no está disponible. Inténtalo más tarde.',
  };

  return messages[status] || `Error del servidor (${status}). Inténtalo de nuevo.`;
}

/**
 * Convierte un error desconocido (catch) en un string legible.
 */
export function getCatchErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Ha ocurrido un error inesperado.';
}

/**
 * Determina si un error es recuperable (puede reintentarse automáticamente).
 */
export function isRetryableError(status: number): boolean {
  return status >= 500 || status === 429 || status === 0;
}
