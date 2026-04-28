import { Sidebar } from '@/components/Creator/Sidebar';

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar className="hidden lg:flex fixed left-0 top-0 h-screen z-50" />
      <div className="flex-1 lg:ml-64">
        {children}
      </div>
    </div>
  );
}
