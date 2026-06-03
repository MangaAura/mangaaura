'use client';

export default function PublicTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-ac-page-enter">
      {children}
    </div>
  );
}
