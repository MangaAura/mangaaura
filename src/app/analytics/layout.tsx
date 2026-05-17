import Navbar from '@/components/Layout/Navbar';
import { SkipToContent } from '@/components/Layout/SkipToContent';

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-fg-primary flex flex-col">
      <SkipToContent />
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
