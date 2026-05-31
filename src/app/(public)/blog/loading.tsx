import { Container } from '@/components/Layout/Container';

export default function BlogLoading() {
  return (
    <Container className="pt-20 pb-10">
      <div className="h-8 w-64 bg-tertiary rounded-lg animate-pulse mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-video bg-tertiary" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-16 bg-tertiary rounded" />
              <div className="h-5 w-3/4 bg-tertiary rounded" />
              <div className="h-4 w-full bg-tertiary rounded" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
