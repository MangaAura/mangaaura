import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthError } from '@/hooks/useAuthError';

const mockToast = vi.fn();

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('useAuthError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null error', () => {
    const { result } = renderHook(() => useAuthError());
    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('returns error message for known auth error code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleAuthError('CredentialsSignin');
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.title).toBe('Credenciales incorrectas');
    expect(result.current.error?.code).toBe('CREDENTIALS_INVALID');
    expect(result.current.hasError).toBe(true);
  });

  it('uses Default error for unknown auth error code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleAuthError('UNKNOWN_CODE');
    });

    expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
  });

  it('handles auth error with custom action', () => {
    const customAction = { label: 'Retry', onClick: vi.fn() };
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleAuthError('CredentialsSignin', customAction);
    });

    expect(result.current.error?.action).toEqual(customAction);
  });

  it('handles register error for known code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleRegisterError('EMAIL_EXISTS');
    });

    expect(result.current.error?.code).toBe('EMAIL_EXISTS');
    expect(result.current.error?.title).toBe('Email ya registrado');
  });

  it('uses fallback for unknown register error code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleRegisterError('UNKNOWN');
    });

    expect(result.current.error?.code).toBe('UNKNOWN_REGISTRATION_ERROR');
  });

  it('handles register error with custom action', () => {
    const customAction = { label: 'Iniciar sesión', onClick: vi.fn() };
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleRegisterError('EMAIL_EXISTS', customAction);
    });

    expect(result.current.error?.action).toEqual(customAction);
  });

  it('handles password reset error for known code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handlePasswordResetError('INVALID_TOKEN');
    });

    expect(result.current.error?.code).toBe('INVALID_TOKEN');
    expect(result.current.error?.severity).toBe('error');
  });

  it('uses fallback for unknown password reset error code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handlePasswordResetError('UNKNOWN');
    });

    expect(result.current.error?.code).toBe('UNKNOWN_RESET_ERROR');
  });

  it('handles password reset error with custom action', () => {
    const customAction = { label: 'Solicitar nuevo', onClick: vi.fn() };
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handlePasswordResetError('INVALID_TOKEN', customAction);
    });

    expect(result.current.error?.action).toEqual(customAction);
  });

  it('handles network error', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleNetworkError();
    });

    expect(result.current.error?.code).toBe('NETWORK_ERROR');
    expect(result.current.error?.severity).toBe('error');
    expect(result.current.error?.title).toBe('Error de conexión');
  });

  it('handles network error with retry action', () => {
    const retryFn = vi.fn();
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleNetworkError(retryFn);
    });

    expect(result.current.error?.action?.label).toBe('Reintentar');
    expect(result.current.error?.action?.onClick).toBe(retryFn);
  });

  it('handles network error without retry when no callback provided', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      const err = result.current.handleNetworkError();
      expect(err.code).toBe('NETWORK_ERROR');
    });

    expect(result.current.error?.action).toBeUndefined();
  });

  it('handles validation error', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleValidationError('email', 'Invalid email format');
    });

    expect(result.current.error?.code).toBe('VALIDATION_ERROR_EMAIL');
    expect(result.current.error?.message).toBe('Invalid email format');
    expect(result.current.error?.severity).toBe('warning');
  });

  it('handles validation error with uppercase field code', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleValidationError('username', 'Too short');
    });

    expect(result.current.error?.code).toBe('VALIDATION_ERROR_USERNAME');
  });

  it('clears error', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.handleAuthError('CredentialsSignin');
    });
    expect(result.current.hasError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('calls toast with success message on showSuccess', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.showSuccess('LOGIN_SUCCESS');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: '¡Bienvenido de vuelta!',
      description: 'Has iniciado sesión correctamente.',
      variant: 'default',
    });
  });

  it('calls toast with different success types', () => {
    const { result } = renderHook(() => useAuthError());

    act(() => {
      result.current.showSuccess('REGISTER_SUCCESS');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: '¡Cuenta creada!',
      description: 'Tu cuenta ha sido creada exitosamente. ¡Bienvenido a InkVerse!',
      variant: 'default',
    });
  });
});
