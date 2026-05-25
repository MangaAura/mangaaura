'use client';

import {
  AlertTriangle,
  Home,
  LogIn,
  ShieldX,
  MailX,
  KeyRound,
  UserX,
  Settings,
  HelpCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { RepeatedChar } from '@/components/ui/RepeatedChar';
import { authErrorMap } from '@/hooks/useAuthError';
import { cn } from '@/lib/utils';

// Configuracion visual para cada tipo de error
const errorVisualConfig: Record<string, {
  icon: React.ElementType;
  bgColor: string;
}> = {
  Configuration: {
    icon: Settings,
    bgColor: 'bg-[var(--error)]/10',
  },
  AccessDenied: {
    icon: ShieldX,
    bgColor: 'bg-[var(--accent-orange)]/10',
  },
  Verification: {
    icon: MailX,
    bgColor: 'bg-[var(--warning)]/10',
  },
  OAuthSignin: {
    icon: KeyRound,
    bgColor: 'bg-[var(--info)]/10',
  },
  OAuthCallback: {
    icon: KeyRound,
    bgColor: 'bg-[var(--info)]/10',
  },
  OAuthCreateAccount: {
    icon: UserX,
    bgColor: 'bg-[var(--accent-purple)]/10',
  },
  EmailCreateAccount: {
    icon: UserX,
    bgColor: 'bg-[var(--accent-purple)]/10',
  },
  Callback: {
    icon: AlertTriangle,
    bgColor: 'bg-[var(--warning)]/10',
  },
  Default: {
    icon: AlertTriangle,
    bgColor: 'bg-[var(--text-tertiary)]/10',
  },
};

// Consejos especificos para cada error
const errorTips: Record<string, string[]> = {
  CredentialsSignin: [
    'Verifica que tu correo electronico este escrito correctamente',
    'Asegurate de que las mayusculas y minusculas sean correctas',
    'Si olvidaste tu contrasena, puedes restablecerla',
  ],
  OAuthSignin: [
    'Asegurate de tener acceso a tu cuenta del proveedor',
    'Verifica que no hayas cancelado el proceso de autenticacion',
    'Intenta con otro metodo de inicio de sesion',
  ],
  OAuthAccountNotLinked: [
    'Este email ya esta registrado con correo/contrasena',
    'Usa el metodo de inicio de sesion original',
    'O contacta al soporte si no recuerdas como te registraste',
  ],
  Verification: [
    'Los enlaces de verificacion expiran despues de 24 horas',
    'Solicita un nuevo email de verificacion',
    'Revisa tu carpeta de spam o correo no deseado',
  ],
  AccessDenied: [
    'Asegurate de tener los permisos necesarios',
    'Contacta al administrador si crees que es un error',
    'Intenta cerrar sesion y volver a iniciar',
  ],
  Default: [
    'Intenta refrescar la pagina',
    'Limpia el cache de tu navegador',
    'Intenta de nuevo en unos minutos',
  ],
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error') || 'Default';

  const errorConfig = authErrorMap[errorType] || authErrorMap.Default;
  const visualConfig = errorVisualConfig[errorType] || errorVisualConfig.Default;
  const tips = errorTips[errorType] || errorTips.Default;
  const Icon = visualConfig.icon;

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-[var(--surface-sunken)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
          {/* Header con icono */}
          <div className="text-center mb-8">
            <div className={cn(
              'inline-flex items-center justify-center w-24 h-24 rounded-full mb-6',
              visualConfig.bgColor
            )}>
      <Icon className={cn('w-12 h-12', errorConfig.severity === 'error' ? 'text-[var(--error)]' : 'text-[var(--warning)]')} />
    </div>
    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
      {errorConfig.title}
    </h1>
    <p className="text-[var(--text-secondary)]">
              {errorConfig.message}
            </p>
          </div>

          {/* Consejos */}
  <div className="bg-[var(--surface-sunken)] rounded-xl p-4 mb-6">
    <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent-blue" />
  Que puedes hacer?
</h2>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={`tip-${index}`} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-accent-blue flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Detalles del error (solo en desarrollo) */}
          {isDevelopment && errorType !== 'Default' && (
    <div className="mb-6 p-4 bg-[var(--surface-sunken)] rounded-xl border border-[var(--border)]">
      <p className="text-xs font-mono text-[var(--text-tertiary)] mb-1">
                Codigo de error:
              </p>
              <code className="text-sm text-[var(--text-primary)] font-mono">
                {errorType}
              </code>
              {errorConfig.code && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Codigo interno: {errorConfig.code}
                </p>
              )}
            </div>
          )}

          {/* Botones de accion */}
          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full gap-2">
                <LogIn className="w-4 h-4" />
                Intentar de nuevo
              </Button>
            </Link>

            {errorType === 'CredentialsSignin' && (
              <Link href="/auth/forgot-password" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <KeyRound className="w-4 h-4" />
                  Recuperar contrasena
                </Button>
              </Link>
            )}

            {errorType === 'Verification' && (
              <Link href="/auth/register" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Solicitar nuevo email
                </Button>
              </Link>
            )}

            <Link href="/" className="block">
              <Button variant="ghost" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
            Sigues teniendo problemas?{' '}
            <a
              href="mailto:support@mangaaura.es"
              className="text-accent-blue hover:underline font-medium"
            >
              Contacta al soporte
            </a>
          </p>
        </div>

        {/* Logo */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <span className="text-xl font-bold text-accent-blue">
          <RepeatedChar text="MangaAura" />
        </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
