import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/Creator/Sidebar';

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/creator');
  }

  const isCreatorOrAdmin = session.user.role === 'CREATOR' || session.user.role === 'ADMIN';
  if (!isCreatorOrAdmin) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      <Sidebar className="hidden lg:flex fixed left-0 top-0 h-screen z-50" />
      <div className="flex-1 lg:ml-64">
        {children}
      </div>
    </div>
  );
}
