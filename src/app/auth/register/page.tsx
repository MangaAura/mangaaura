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
    <div className="min-h-screen bg-primary font-sans text-fg-primary flex items-center justify-center">
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
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Por favor ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string(),
});

const registerSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof registerSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

function Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { error, clearError, handleNetworkError, handleValidationError } = useAuthError();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Validación en tiempo real
  const fieldLabels: Record<keyof FormData, string> = {
    username: 'Nombre de usuario',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
  };

  const validateField = (field: keyof FormData, value: string) => {
    if (field === 'confirmPassword') {
      if (!value) {
        setErrors((prev) => ({ ...prev, [field]: `${fieldLabels[field]}: Debes confirmar la contraseña` }));
        return false;
      }
      if (value !== formData.password) {
        setErrors((prev) => ({ ...prev, [field]: `${fieldLabels[field]}: Las contraseñas no coinciden` }));
        return false;
      }
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return true;
    }

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [field]: `${fieldLabels[field]}: Este campo es obligatorio` }));
      return false;
    }

    try {
      baseSchema.shape[field].parse(value);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return true;
    } catch (err) {
      if (err instanceof z.ZodError && err.issues?.[0]?.message) {
        setErrors((prev) => ({ ...prev, [field]: `${fieldLabels[field]}: ${err.issues[0].message}` }));
        return false;
      }
      setErrors((prev) => ({ ...prev, [field]: `${fieldLabels[field]}: Campo inválido` }));
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError();
    
    // Validar en tiempo real si ya fue tocado
    if (touched[name as keyof FormData]) {
      validateField(name as keyof FormData, value);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name as keyof FormData, value);
  };

  const validateForm = (): boolean => {
    const result = registerSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }
    const newErrors: FormErrors = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof FormData;
      if (!newErrors[field]) {
        newErrors[field] = `${fieldLabels[field]}: ${issue.message}`;
      }
    });
    setErrors(newErrors);
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      handleValidationError('form', 'Por favor corrige los errores en el formulario');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
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
        // Manejar errores específicos del servidor
        if (data.error?.includes('email') && data.error?.includes('already exists')) {
          const errorInfo = registerErrorMap.EMAIL_EXISTS;
          errorInfo.action = {
            label: 'Iniciar sesión',
            onClick: () => router.push('/auth/login'),
          };
          handleValidationError('email', errorInfo.message);
          setIsLoading(false);
          return;
        }
        
        if (data.error?.includes('username') && data.error?.includes('already exists')) {
          handleValidationError('username', registerErrorMap.USERNAME_EXISTS.message);
          setIsLoading(false);
          return;
        }

        throw new Error(data.error || 'Error al registrar');
      }

      // Registro exitoso - intentar login automático
      toast({
        title: '¡Cuenta creada!',
        description: 'Tu cuenta ha sido creada exitosamente. Iniciando sesión...',
        variant: 'default',
      });

      // Auto-login
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.ok) {
        toast({
          title: '¡Bienvenido a InkVerse!',
          description: 'Has iniciado sesión correctamente.',
          variant: 'default',
        });
        router.push(callbackUrl);
        router.refresh();
      } else {
        // Si auto-login falla, redirigir a login
        router.push('/auth/login?registered=true');
      }
    } catch (err) {
      const networkError = handleNetworkError(() => handleSubmit(e));
      setIsLoading(false);
    }
  };

  // Indicadores de fortaleza de contraseña
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte', 'Muy fuerte'];
    const colors = ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-emerald-500'];
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const hasErrors = Object.values(errors).some(Boolean);
  const errorFields = Object.entries(errors).filter(([, v]) => v) as [keyof FormData, string][];

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
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">Crear cuenta</h1>
            <p className="text-muted">Únete a InkVerse y descubre un mundo de mangas.</p>
          </div>

          <div className="bg-secondary border border-custom rounded-2xl p-8 shadow-xl">
            {/* Error general del formulario */}
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

            {/* Resumen de errores de validación */}
            {hasErrors && errorFields.length > 1 && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Corrige los siguientes errores ({errorFields.length}):
                </p>
                <ul className="space-y-1">
                  {errorFields.map(([field, msg]) => (
                    <li key={field} className="text-sm text-red-400 flex items-start gap-2">
                      <span className="text-red-500 font-bold mt-0.5">&bull;</span>
                      <span><strong className="text-red-500">{fieldLabels[field]}:</strong> {msg.replace(`${fieldLabels[field]}: `, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-2">Nombre de usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                      touched.username && errors.username
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touched.username && !errors.username && formData.username
                        ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                    )}
                    placeholder="usuario123"
                  />
                  {touched.username && !errors.username && formData.username && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                  )}
                </div>
        {touched.username && errors.username && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-500">{errors.username}</p>
          </div>
        )}
                <p className="mt-1 text-xs text-muted">
                  Solo letras, números y guiones bajos. Entre 3 y 30 caracteres.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2">Correo electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    className={cn(
                      'w-full pl-10 pr-4 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                      touched.email && errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touched.email && !errors.email && formData.email
                        ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                    )}
                    placeholder="tu@email.com"
                  />
                  {touched.email && !errors.email && formData.email && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                  )}
                </div>
        {touched.email && errors.email && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-500">{errors.email}</p>
          </div>
        )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                      touched.password && errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touched.password && !errors.password && formData.password
                        ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Indicador de fortaleza */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'flex-1 rounded-full transition-colors',
                            passwordStrength.strength >= level
                              ? passwordStrength.color
                              : 'bg-gray-200 dark:bg-gray-700'
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
                
        {touched.password && errors.password && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-500">{errors.password}</p>
          </div>
        )}
                
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted flex items-center gap-1">
                    {formData.password.length >= 8 ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <Info className="w-3 h-3 text-muted" />
                    )}
                    Mínimo 8 caracteres
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    {/[A-Z]/.test(formData.password) ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <Info className="w-3 h-3 text-muted" />
                    )}
                    Al menos una mayúscula
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    {/[a-z]/.test(formData.password) ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <Info className="w-3 h-3 text-muted" />
                    )}
                    Al menos una minúscula
                  </p>
                  <p className="text-xs text-muted flex items-center gap-1">
                    {/[0-9]/.test(formData.password) ? (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    ) : (
                      <Info className="w-3 h-3 text-muted" />
                    )}
                    Al menos un número
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-2">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    className={cn(
                      'w-full pl-10 pr-12 py-3 bg-tertiary border rounded-xl outline-none transition-all text-sm',
                      touched.confirmPassword && errors.confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword
                        ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500'
                        : 'border-custom focus:border-accent-blue focus:ring-1 focus:ring-accent-blue'
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
        {touched.confirmPassword && errors.confirmPassword && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-500">{errors.confirmPassword}</p>
          </div>
        )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent-blue hover:bg-accent-blue-hover text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Crear cuenta
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted mt-6">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="text-accent-blue font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted mt-6">
            Al crear una cuenta, aceptas nuestros{' '}
            <Link href="/terms" className="text-accent-blue hover:underline">Términos de servicio</Link>
            {' '}y{' '}
            <Link href="/privacy" className="text-accent-blue hover:underline">Política de privacidad</Link>.
          </p>
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
