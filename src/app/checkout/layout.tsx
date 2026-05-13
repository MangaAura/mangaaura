import Navbar from '@/components/Layout/Navbar';
import { PageTransition } from '@/components/ui/PageTransition';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
