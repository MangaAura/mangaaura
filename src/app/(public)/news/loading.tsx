import { Container } from '@/components/Layout/Container';

export default function NewsLoading() {
  return (
    <Container className="pt-20 pb-10">
      <div className="h-8 w-64 bg-tertiary rounded-lg animate-pulse mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-secondary border border-custom rounded-xl p-5 h-36 animate-pulse">
            <div className="h-4 w-20 bg-tertiary rounded mb-3" />
            <div className="h-6 w-3/4 bg-tertiary rounded mb-2" />
            <div className="h-4 w-full bg-tertiary rounded" />
          </div>
        ))}
      </div>
    </Container>
  );
}
