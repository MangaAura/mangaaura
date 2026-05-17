import Navbar from '@/components/Layout/Navbar';

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
