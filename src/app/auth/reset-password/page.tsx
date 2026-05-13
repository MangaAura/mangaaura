'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Lock, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Shield,
  KeyRound
} from 'lucide-react';
import { z } from 'zod';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/ui/Toast';
import { useAuthError, passwordResetErrorMap } from '@/hooks/useAuthError';
import { cn } from '@/lib/utils';

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
}).refine((data: any) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type FormState = 'initial' | 'loading' | 'success' | 'error' | 'invalid_token';

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const { error, clearError, handleNetworkError, handlePasswordResetError } = useAuthError();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formState, setFormState] = useState<FormState>('initial');
  const [countdown, setCountdown] = useState(5);

  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [validationErrors, setValidationErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // Validación en tiempo real
  const validateField = (field: 'password' | 'confirmPassword', value: string) => {
    try {
      if (field === 'password') {
        const fieldSchema = resetPasswordSchema.shape.password;
        fieldSchema.parse(value);
      } else {
        // Validar que coincidan
        if (value !== password) {
          setValidationErrors((prev: any) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
          return false;
        }
      }
      setValidationErrors((prev: any) => ({ ...prev, [field]: undefined }));
      return true;
    } catch (err: any) {
  if (err instanceof z.ZodError) {
  const message = (err as any).errors[0]?.message || 'Campo inválido';
        setValidationErrors((prev: any) => ({ ...prev, [field]: message }));
        return false;
      }
      return false;
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    clearError();
    if (touched.password) {
      validateField('password', value);
    }
    // Revalidar confirmPassword si ya tiene valor
    if (touched.confirmPassword && confirmPassword) {
      validateField('confirmPassword', confirmPassword);
    }
  };

  const handleConfirmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    clearError();
    if (touched.confirmPassword) {
      validateField('confirmPassword', value);
    }
  };

  const handleBlur = (field: 'password' | 'confirmPassword') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, field === 'password' ? password : confirmPassword);
  };

  // Verificar token al cargar
  useEffect(() => {
    if (!token) {
      setFormState('invalid_token');
      handlePasswordResetError('INVALID_TOKEN');
    }
  }, [token]);

  // Countdown para redirección
  useEffect(() => {
    if (formState === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (formState === 'success' && countdown === 0) {
      router.push('/auth/login');
    }
  }, [formState, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    clearError();

    if (!token) {
      handlePasswordResetError('INVALID_TOKEN', {
        label: 'Solicitar nuevo enlace',
        onClick: () => router.push('/auth/forgot-password'),
      });
      setFormState('invalid_token');
      return;
    }

    // Validar campos
    try {
      resetPasswordSchema.parse({ password, confirmPassword });
  } catch (err: any) {
  if (err instanceof z.ZodError) {
  const errors: { password?: string; confirmPassword?: string } = {};
  (err as any).errors.forEach((error: any) => {
          const field = error.path[0] as 'password' | 'confirmPassword';
          errors[field] = error.message;
        });
        setValidationErrors(errors);
        setFormState('error');
        return;
      }
    }

    setFormState('loading');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (data.error?.includes('expired') || data.error?.includes('expirado')) {
          handlePasswordResetError('TOKEN_EXPIRED', {
            label: 'Solicitar nuevo enlace',
            onClick: () => router.push('/auth/forgot-password'),
          });
          setFormState('invalid_token');
          return;
        }
        
        if (data.error?.includes('token') || data.error?.includes('inválido')) {
          handlePasswordResetError('INVALID_TOKEN', {
            label: 'Solicitar nuevo enlace',
            onClick: () => router.push('/auth/forgot-password'),
          });
          setFormState('invalid_token');
          return;
        }

        throw new Error(data.error || 'Error al restablecer la contraseña');
      }

      setFormState('success');
      toast({
        title: '¡Contraseña actualizada!',
        description: 'Tu contraseña ha sido restablecida correctamente. Serás redirigido al inicio de sesión.',
        variant: 'default',
      });
    } catch (err) {
      const networkError = handleNetworkError(() => handleSubmit(e));
      setFormState('error');
    }
  };

  // Vista de token inválido
  if (formState === 'invalid_token') {
    return (
      <div className="min-h-screen bg-background font-sans text-fg-primary flex flex-col">
        <div className="p-6">
          <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
            <ArrowLeft size={20} /> Volver al Inicio
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-[var(--error)]" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
                Enlace Inválido o Expirado
              </h3>
              <p className="text-muted mb-6">
                El enlace de recuperación no es válido o ha expirado. Por seguridad, estos enlaces solo son válidos por 1 hora.
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/forgot-password"
className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-semibold rounded-xl transition-colors"
          >
            <KeyRound size={18} />
                  Solicitar nuevo enlace
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 text-accent-blue hover:text-accent-blue-hover font-semibold transition-colors"
                >
                  <ArrowLeft size={18} />
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> Volver al Inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {formState === 'success' ? '¡Listo!' : 'Nueva Contraseña'}
            </h1>
            <p className="text-muted">
              {formState === 'success'
                ? `Serás redirigido al inicio de sesión en ${countdown} segundos...`
                : 'Crea una contraseña segura para tu cuenta.'}
            </p>
          </div>

          <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-xl">
            {formState === 'success' ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">
                  ¡Contraseña Actualizada!
                </h3>
                <p className="text-muted mb-6">
                  Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
                </p>
                <Link
                  href="/auth/login"
className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
                  Ir al inicio de sesión ahora
                </Link>
              </div>
            ) : (
              <>
                {/* Mensaje de error general */}
                {error && (
                  <div className="mb-6">
                    <ErrorMessage
                      title={error.title}
                      message={error.message}
                      severity={error.severity}
                      onDismiss={clearError}
                      action={error.action}
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Nueva Contraseña */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nueva Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleBlur('password')}
                        disabled={formState === 'loading'}
                        className={cn(
                          'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                          touched.password && validationErrors.password
? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-1 focus:ring-[var(--error)]'
: touched.password && !validationErrors.password && password
? 'border-[var(--success)] focus:border-[var(--success)] focus:ring-1 focus:ring-[var(--success)]'
                            : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                        )}
                        placeholder="Mínimo 8 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Indicador de fortaleza */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 h-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                'flex-1 rounded-full transition-colors',
                                passwordStrength.strength >= level
                                  ? passwordStrength.color
                                  : 'bg-[var(--border)]'
                              )}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Fortaleza: <span className={cn('font-medium', passwordStrength.color.replace('bg-', 'text-'))}>
                            {passwordStrength.label}
                          </span>
                        </p>
                      </div>
                    )}

                    {touched.password && validationErrors.password && (
<p className="mt-1 text-xs text-[var(--error)] flex items-center gap-1">
<AlertCircle className="w-3 h-3" />
{validationErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirmar Contraseña */}
                  <div>
                    <label className="block text-sm font-semibold mb-2">Confirmar Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={handleConfirmChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        disabled={formState === 'loading'}
                        className={cn(
                          'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                          touched.confirmPassword && validationErrors.confirmPassword
? 'border-[var(--error)] focus:border-[var(--error)] focus:ring-1 focus:ring-[var(--error)]'
: touched.confirmPassword && !validationErrors.confirmPassword && confirmPassword
? 'border-[var(--success)] focus:border-[var(--success)] focus:ring-1 focus:ring-[var(--success)]'
                            : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                        )}
                        placeholder="Repite tu contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {touched.confirmPassword && validationErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-[var(--error)] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* Botón Submit */}
                  <button
                    type="submit"
                    disabled={formState === 'loading'}
                    className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formState === 'loading' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Restablecer Contraseña
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-custom">
                  <p className="text-sm text-muted">
                    <strong className="text-[var(--text-primary)]">Consejo de seguridad:</strong>
                    <br />
                    Usa una combinación de letras mayúsculas, minúsculas, números y símbolos para mayor seguridad.
                  </p>
                </div>
              </>
            )}
          </div>

          {formState !== 'success' && (
            <p className="text-center text-sm text-muted mt-8">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Función helper para calcular fortaleza de contraseña
function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  if (!password) return { strength: 0, label: '', color: '' };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
  const colors = ['bg-[var(--error)]', 'bg-[var(--error)]', 'bg-[var(--warning)]', 'bg-[var(--info)]', 'bg-[var(--success)]', 'bg-[var(--success)]'];
  
  return {
    strength,
    label: labels[strength],
    color: colors[strength],
  };
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted">
        <Loader2 size={24} className="animate-spin" />
        <span>Cargando...</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Content />
    </Suspense>
  );
}
