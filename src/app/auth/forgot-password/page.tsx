'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/ui/Toast';
import { useAuthError, passwordResetErrorMap } from '@/hooks/useAuthError';
import { cn } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor ingresa un correo electrónico válido'),
});

type FormState = 'initial' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>('initial');
  const { toast } = useToast();
  const { error, clearError, handleNetworkError, handleValidationError } = useAuthError();
  
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateEmail = (value: string): boolean => {
    try {
      forgotPasswordSchema.parse({ email: value });
      setValidationError('');
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.errors[0]?.message || 'Email inválido';
        setValidationError(message);
        return false;
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    clearError();
    
    if (touched) {
      validateEmail(value);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateEmail(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    clearError();

    // Validar antes de enviar
    if (!validateEmail(email)) {
      handleValidationError('email', validationError);
      setFormState('error');
      return;
    }

    setFormState('loading');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos
        if (data.error?.includes('not found') || data.error?.includes('no existe')) {
          // Por seguridad, no revelar si el email existe
          // Mostrar mensaje de éxito igual
          setFormState('success');
          toast({
            title: 'Email enviado',
            description: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.',
            variant: 'default',
          });
          return;
        }
        throw new Error(data.error || 'Error al enviar el email');
      }

      setFormState('success');
      toast({
        title: '¡Email enviado!',
        description: 'Revisa tu bandeja de entrada para continuar.',
        variant: 'default',
      });
    } catch (err) {
      const networkError = handleNetworkError(() => handleSubmit(e));
      setFormState('error');
      
      // Por seguridad, mostrar éxito igual
      // para no revelar si el email existe o no
      setTimeout(() => {
        setFormState('success');
        toast({
          title: 'Email enviado',
          description: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.',
          variant: 'default',
        });
      }, 100);
    }
  };

  const isValidEmail = touched && !validationError && email.length > 0;
  const hasError = (touched && validationError) || (formState === 'error' && error);

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> Volver al Inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              {formState === 'success' ? '¡Revisa tu email!' : 'Recuperar Contraseña'}
            </h1>
            <p className="text-muted">
              {formState === 'success'
                ? 'Te hemos enviado instrucciones para restablecer tu contraseña.'
                : 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.'}
            </p>
          </div>

          <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-xl">
            {formState === 'success' ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[var(--success)]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Email Enviado</h3>
                <p className="text-muted mb-6">
                  Si existe una cuenta con el email <strong className="text-[var(--text-primary)]">{email}</strong>, 
                  recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada y carpeta de spam.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-accent-blue hover:bg-accent-blue-hover text-white font-semibold rounded-xl transition-colors"
                  >
                    <ArrowLeft size={18} />
                    Volver al inicio de sesión
                  </Link>
                  <button
                    onClick={() => {
                      setFormState('initial');
                      setEmail('');
                      setTouched(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 text-accent-blue hover:text-accent-blue-hover font-semibold transition-colors"
                  >
                    Enviar de nuevo
                    <ArrowRight size={18} />
                  </button>
                </div>
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
                  <div>
                    <label className="block text-sm font-semibold mb-2">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={formState === 'loading'}
                        className={cn(
                          'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                          hasError
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : isValidEmail
                            ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                            : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                        )}
                        placeholder="tu@email.com"
                      />
                      {isValidEmail && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                      )}
                    </div>
                    {touched && validationError && (
                      <div className="mt-2">
                        <ErrorMessage
                          message={validationError}
                          severity="warning"
                          icon={<Mail className="w-4 h-4" />}
                        />
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      Ingresa el email asociado a tu cuenta. Te enviaremos un enlace seguro.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={formState === 'loading' || !!validationError}
                    className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formState === 'loading' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail size={18} />
                        Enviar Enlace de Recuperación
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-custom">
                  <p className="text-sm text-muted">
                    <strong className="text-[var(--text-primary)]">¿No recibiste el email?</strong>
                    <br />
                    Revisa tu carpeta de spam o solicita un nuevo enlace en unos minutos.
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
