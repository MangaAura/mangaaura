import { LogIn, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { auth } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export async function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Inicia sesión para continuar
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Necesitas tener una cuenta para acceder a esta página.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-semibold rounded-xl transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as string)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--warning)]/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-[var(--warning)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Acceso denegado
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              No tienes los permisos necesarios para acceder a esta página.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] font-semibold rounded-xl transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
