import Navbar from '@/components/Layout/Navbar';
import { MobileBottomNav } from '@/components/Layout/MobileBottomNav';
import { PageTransition } from '@/components/ui/PageTransition';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <MobileBottomNav />
    </div>
  );
}
