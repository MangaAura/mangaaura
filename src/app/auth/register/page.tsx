'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { useAuthError, registerErrorMap } from '@/hooks/useAuthError';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted">
        <Loader2 size={24} className="animate-spin" />
        <span>Cargando...</span>
      </div>
    </div>
  );
}

const baseSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(30, 'El nombre de usuario no puede exceder 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guiones bajos'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
});

const registerSchema = baseSchema.refine((data: any) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type _Output<T> = T extends { _zod: { output: infer O } } ? O : never;
type FormData = _Output<typeof baseSchema>;

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const { toast } = useToast();
const { error, setError, clearError, handleAuthError: handleRegisterAuthError } = useAuthError();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleOAuthSignIn = (provider: 'google' | 'github') => {
    setIsLoading(true);
    clearError();
    signIn(provider, { callbackUrl });
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { label: '', color: '', score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { label: '', color: 'bg-[var(--border)]' },
{ label: 'Débil', color: 'bg-[var(--error)]' },
    { label: 'Regular', color: 'bg-[var(--accent-orange)]' },
  { label: 'Buena', color: 'bg-[var(--warning)]' },
  { label: 'Fuerte', color: 'bg-[var(--success)]' },
  { label: 'Muy fuerte', color: 'bg-[var(--success)]' },
    ];

    return { ...levels[score], score };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const hasErrors = Object.values(errors).some(Boolean);
  const errorFields = Object.entries(errors).filter(([, v]) => v) as [keyof FormData, string][];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearError();

    try {
      const validated = registerSchema.safeParse(formData);

      if (!validated.success) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {};
        (validated.error as any).errors.forEach((err: any) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear cuenta');
      }

      toast({ title: 'Cuenta creada exitosamente', variant: 'default' });

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        router.push('/auth/login?registered=true');
      }
    } catch (err: any) {
      handleRegisterAuthError(err);
      setIsLoading(false);
    }
  };

  const validateField = (field: keyof FormData, value: string) => {
    if (field === 'confirmPassword') {
      if (!value) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Confirma tu contraseña' }));
      } else if (value !== formData.password) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
      return;
    }

    const fieldSchema = baseSchema.shape[field as keyof typeof baseSchema.shape];
    const result = fieldSchema.safeParse(value);

    if (!result.success) {
      setErrors((prev) => ({ ...prev, [field]: (result.error as any).issues[0].message }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const fieldLabels: Record<keyof FormData, string> = {
    username: 'Usuario',
    email: 'Correo',
    password: 'Contraseña',
    confirmPassword: 'Confirmar',
  };

  return (
    <div className="flex flex-col">
      <div className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-fg-primary transition-colors">
          <ArrowLeft size={20} /> Volver al Inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Crear cuenta</h1>
            <p className="text-muted">Únete a InkVerse y descubre un mundo de mangas.</p>
          </div>

          <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-xl">
            {error && (
              <div className="mb-6">
                <ErrorMessage
                  title={error.title}
                  message={error.message}
                  severity={error.severity}
                  onDismiss={clearError}
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre de usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData((prev: any) => ({ ...prev, username: e.target.value }));
                      validateField('username', e.target.value);
                    }}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
errors.username
? 'border-[var(--error)] focus:border-[var(--error)]'
: formData.username && !errors.username
? 'border-[var(--success)] focus:border-[var(--success)]'
                        : 'border-custom focus:border-accent-blue'
                    )}
                    placeholder="usuario123"
                    disabled={isLoading}
                  />
                  {formData.username && !errors.username && (
<CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]" size={18} />
)}
</div>
{errors.username && (
<div className="mt-2 flex items-start gap-2 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg">
<AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
<p className="text-sm font-medium text-[var(--error)]">{errors.username}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev: any) => ({ ...prev, email: e.target.value }));
                      validateField('email', e.target.value);
                    }}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
errors.email
? 'border-[var(--error)] focus:border-[var(--error)]'
: formData.email && !errors.email
? 'border-[var(--success)] focus:border-[var(--success)]'
                        : 'border-custom focus:border-accent-blue'
                    )}
                    placeholder="tu@email.com"
                    disabled={isLoading}
                  />
                  {formData.email && !errors.email && (
<CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--success)]" size={18} />
)}
</div>
{errors.email && (
<div className="mt-2 flex items-start gap-2 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg">
<AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
<p className="text-sm font-medium text-[var(--error)]">{errors.email}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev: any) => ({ ...prev, password: e.target.value }));
                      validateField('password', e.target.value);
                    }}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                      errors.password ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                    )}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-full transition-colors',
                            i <= passwordStrength.score ? passwordStrength.color : 'bg-[var(--border)]'
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
                {errors.password && (
<div className="mt-2 flex items-start gap-2 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg">
<AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
<p className="text-sm font-medium text-[var(--error)]">{errors.password}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData((prev: any) => ({ ...prev, confirmPassword: e.target.value }));
                      validateField('confirmPassword', e.target.value);
                    }}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                      errors.confirmPassword ? 'border-[var(--error)]' : 'border-custom focus:border-accent-blue'
                    )}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
<div className="mt-2 flex items-start gap-2 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg">
<AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0 mt-0.5" />
<p className="text-sm font-medium text-[var(--error)]">{errors.confirmPassword}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !acceptedTerms}
                className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Crear cuenta
                  </>
                )}
              </button>
      </form>

      <div className="mt-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-custom after:h-px after:flex-1 after:bg-custom text-xs text-muted font-medium">
        O REGÍSTRATE CON
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading}
          type="button"
          className="flex items-center justify-center gap-2 bg-tertiary hover:bg-custom border border-custom py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Google
        </button>
        <button
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading}
          type="button"
          className="flex items-center justify-center gap-2 bg-tertiary hover:bg-custom border border-custom py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          GitHub
        </button>
      </div>

      <p className="text-center text-sm text-muted mt-6">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>

            <p className="text-center text-xs text-muted mt-6">
              Al crear una cuenta, aceptas nuestros{' '}
              <Link href="/legal/terms" className="text-accent-blue hover:underline">Términos de servicio</Link>
              {' '}y{' '}
              <Link href="/legal/privacy" className="text-accent-blue hover:underline">Política de privacidad</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Content />
    </Suspense>
  );
}
