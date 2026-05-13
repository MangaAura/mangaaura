import Navbar from '@/components/Layout/Navbar';
import { PageTransition } from '@/components/ui/PageTransition';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--text-primary)]">
      <Navbar />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
