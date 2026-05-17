import Navbar from '@/components/Layout/Navbar';
import { PageTransition } from '@/components/ui/PageTransition';

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <div role="main" id="main-content" className="flex-1">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
