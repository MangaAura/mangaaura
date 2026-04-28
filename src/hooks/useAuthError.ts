/**
 * useAuthError Hook
 *
 * Hook especializado para manejar errores de autenticación con mensajes amigables.
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export type AuthErrorSeverity = 'error' | 'warning' | 'info';

export interface AuthError {
  title: string;
  message: string;
  severity: AuthErrorSeverity;
  code?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Mapeo de errores de NextAuth a mensajes amigables
export const authErrorMap: Record<string, AuthError> = {
  CredentialsSignin: {
    title: 'Credenciales incorrectas',
    message: 'El correo electrónico o la contraseña que ingresaste no son correctos. Por favor, verifica e inténtalo de nuevo.',
    severity: 'error',
    code: 'CREDENTIALS_INVALID',
  },
  OAuthSignin: {
    title: 'Error al iniciar sesión',
    message: 'Ocurrió un problema al iniciar sesión con el proveedor seleccionado. Por favor, inténtalo de nuevo.',
    severity: 'error',
    code: 'OAUTH_ERROR',
  },
  OAuthCallback: {
    title: 'Error de autenticación',
    message: 'No se pudo completar el proceso de autenticación. Por favor, inténtalo de nuevo.',
    severity: 'error',
    code: 'OAUTH_CALLBACK_ERROR',
  },
  OAuthCreateAccount: {
    title: 'Error al crear cuenta',
    message: 'No se pudo crear la cuenta con este proveedor. Es posible que ya exista una cuenta con este email.',
    severity: 'warning',
    code: 'OAUTH_ACCOUNT_EXISTS',
  },
  OAuthAccountNotLinked: {
    title: 'Cuenta no vinculada',
    message: 'Este email ya está registrado con otro método de inicio de sesión. Por favor, usa el método original.',
    severity: 'warning',
    code: 'ACCOUNT_NOT_LINKED',
  },
  EmailCreateAccount: {
    title: 'Error al crear cuenta',
    message: 'No se pudo crear la cuenta. Por favor, verifica tu información e inténtalo de nuevo.',
    severity: 'error',
    code: 'EMAIL_CREATE_ERROR',
  },
  EmailSignin: {
    title: 'Error al enviar correo',
    message: 'No se pudo enviar el correo de inicio de sesión. Por favor, verifica tu dirección de email.',
    severity: 'error',
    code: 'EMAIL_SEND_ERROR',
  },
  Callback: {
    title: 'Error de autenticación',
    message: 'Ocurrió un problema durante el proceso de autenticación. Por favor, inténtalo de nuevo.',
    severity: 'error',
    code: 'CALLBACK_ERROR',
  },
  Verification: {
    title: 'Enlace expirado',
    message: 'El enlace de verificación ha expirado o no es válido. Solicita un nuevo correo de verificación.',
    severity: 'warning',
    code: 'VERIFICATION_EXPIRED',
  },
  AccessDenied: {
    title: 'Acceso denegado',
    message: 'No tienes permiso para acceder a este recurso. Verifica tus credenciales o contacta al administrador.',
    severity: 'error',
    code: 'ACCESS_DENIED',
  },
  SessionRequired: {
    title: 'Sesión requerida',
    message: 'Debes iniciar sesión para acceder a esta página.',
    severity: 'warning',
    code: 'SESSION_REQUIRED',
  },
  Configuration: {
    title: 'Error de configuración',
    message: 'Hay un problema con la configuración del servidor de autenticación. Por favor, contacta al soporte.',
    severity: 'error',
    code: 'CONFIG_ERROR',
  },
  Default: {
    title: 'Error de autenticación',
    message: 'Ocurrió un error inesperado al intentar iniciar sesión. Por favor, inténtalo de nuevo más tarde.',
    severity: 'error',
    code: 'UNKNOWN_ERROR',
  },
};

// Errores de registro específicos
export const registerErrorMap: Record<string, AuthError> = {
  EMAIL_EXISTS: {
    title: 'Email ya registrado',
    message: 'Ya existe una cuenta con este correo electrónico. ¿Quieres iniciar sesión en su lugar?',
    severity: 'warning',
    code: 'EMAIL_EXISTS',
  },
  USERNAME_EXISTS: {
    title: 'Usuario no disponible',
    message: 'Este nombre de usuario ya está en uso. Por favor, elige otro.',
    severity: 'warning',
    code: 'USERNAME_EXISTS',
  },
  INVALID_EMAIL: {
    title: 'Email inválido',
    message: 'Por favor, ingresa una dirección de correo electrónico válida.',
    severity: 'warning',
    code: 'INVALID_EMAIL',
  },
  WEAK_PASSWORD: {
    title: 'Contraseña débil',
    message: 'Tu contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.',
    severity: 'warning',
    code: 'WEAK_PASSWORD',
  },
  PASSWORDS_MISMATCH: {
    title: 'Contraseñas no coinciden',
    message: 'Las contraseñas que ingresaste no coinciden. Por favor, verifica e inténtalo de nuevo.',
    severity: 'warning',
    code: 'PASSWORDS_MISMATCH',
  },
  REGISTRATION_FAILED: {
    title: 'Error al registrar',
    message: 'No se pudo completar el registro. Por favor, inténtalo de nuevo más tarde.',
    severity: 'error',
    code: 'REGISTRATION_FAILED',
  },
};

// Errores de recuperación de contraseña
export const passwordResetErrorMap: Record<string, AuthError> = {
  INVALID_TOKEN: {
    title: 'Enlace inválido',
    message: 'El enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.',
    severity: 'error',
    code: 'INVALID_TOKEN',
  },
  TOKEN_EXPIRED: {
    title: 'Enlace expirado',
    message: 'El enlace de recuperación ha expirado. Por seguridad, estos enlaces solo son válidos por 1 hora. Solicita uno nuevo.',
    severity: 'warning',
    code: 'TOKEN_EXPIRED',
  },
  USER_NOT_FOUND: {
    title: 'Usuario no encontrado',
    message: 'No encontramos una cuenta asociada a este email. Por favor, verifica la dirección e inténtalo de nuevo.',
    severity: 'warning',
    code: 'USER_NOT_FOUND',
  },
  EMAIL_NOT_FOUND: {
    title: 'Email no registrado',
    message: 'No encontramos una cuenta con este correo electrónico. ¿Quizás quieres registrarte?',
    severity: 'info',
    code: 'EMAIL_NOT_FOUND',
  },
  RESET_FAILED: {
    title: 'Error al restablecer',
    message: 'No se pudo restablecer tu contraseña. Por favor, inténtalo de nuevo más tarde.',
    severity: 'error',
    code: 'RESET_FAILED',
  },
};

// Mensajes de éxito
export const authSuccessMessages = {
  LOGIN_SUCCESS: {
    title: '¡Bienvenido de vuelta!',
    message: 'Has iniciado sesión correctamente.',
  },
  REGISTER_SUCCESS: {
    title: '¡Cuenta creada!',
    message: 'Tu cuenta ha sido creada exitosamente. ¡Bienvenido a InkVerse!',
  },
  LOGOUT_SUCCESS: {
    title: 'Sesión cerrada',
    message: 'Has cerrado sesión correctamente.',
  },
  PASSWORD_RESET_EMAIL_SENT: {
    title: 'Email enviado',
    message: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.',
  },
  PASSWORD_RESET_SUCCESS: {
    title: '¡Contraseña actualizada!',
    message: 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.',
  },
  EMAIL_VERIFIED: {
    title: '¡Email verificado!',
    message: 'Tu correo electrónico ha sido verificado correctamente.',
  },
};

export function useAuthError() {
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  const handleAuthError = useCallback(
    (errorCode: string, customAction?: { label: string; onClick: () => void }) => {
      const authError = authErrorMap[errorCode] || authErrorMap.Default;
      const errorWithAction = customAction
        ? { ...authError, action: customAction }
        : authError;
      
      setError(errorWithAction);
      return errorWithAction;
    },
    []
  );

  const handleRegisterError = useCallback(
    (errorCode: string, customAction?: { label: string; onClick: () => void }) => {
      const registerError = registerErrorMap[errorCode] || {
        title: 'Error al registrar',
        message: 'Ocurrió un error al crear tu cuenta. Por favor, inténtalo de nuevo.',
        severity: 'error',
        code: 'UNKNOWN_REGISTRATION_ERROR',
      };
      
      const errorWithAction = customAction
        ? { ...registerError, action: customAction }
        : registerError;
      
      setError(errorWithAction);
      return errorWithAction;
    },
    []
  );

  const handlePasswordResetError = useCallback(
    (errorCode: string, customAction?: { label: string; onClick: () => void }) => {
      const resetError = passwordResetErrorMap[errorCode] || {
        title: 'Error',
        message: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
        severity: 'error',
        code: 'UNKNOWN_RESET_ERROR',
      };
      
      const errorWithAction = customAction
        ? { ...resetError, action: customAction }
        : resetError;
      
      setError(errorWithAction);
      return errorWithAction;
    },
    []
  );

  const showSuccess = useCallback(
    (type: keyof typeof authSuccessMessages) => {
      const success = authSuccessMessages[type];
      toast({
        title: success.title,
        description: success.message,
        variant: 'default',
      });
    },
    [toast]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleNetworkError = useCallback((retry?: () => void): AuthError => {
    const networkError: AuthError = {
      title: 'Error de conexión',
      message: navigator.onLine
        ? 'No se pudo conectar con el servidor. El servidor puede estar temporalmente fuera de servicio.'
        : 'Parece que no tienes conexión a internet. Verifica tu conexión e inténtalo de nuevo.',
      severity: 'error',
      code: 'NETWORK_ERROR',
      action: retry
        ? {
            label: 'Reintentar',
            onClick: retry,
          }
        : undefined,
    };
    
    setError(networkError);
    return networkError;
  }, []);

  const handleValidationError = useCallback(
    (field: string, message: string): AuthError => {
      const validationError: AuthError = {
        title: 'Datos inválidos',
        message: message,
        severity: 'warning',
        code: `VALIDATION_ERROR_${field.toUpperCase()}`,
      };
      
      setError(validationError);
      return validationError;
    },
    []
  );

  return {
    error,
    setError,
    clearError,
    handleAuthError,
    handleRegisterError,
    handlePasswordResetError,
    handleNetworkError,
    handleValidationError,
    showSuccess,
    hasError: error !== null,
  };
}

export default useAuthError;
