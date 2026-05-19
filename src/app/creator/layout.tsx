import { redirect } from 'next/navigation';

import { Sidebar } from '@/components/Creator/Sidebar';
import { SkipToContent } from '@/components/Layout/SkipToContent';
import { PageTransition } from '@/components/ui/PageTransition';
import { auth } from '@/lib/auth';

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
      <SkipToContent />
      <Sidebar className="hidden lg:flex fixed left-0 top-0 h-screen z-50" />
      <main id="main-content" className="flex-1 lg:ml-64">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
