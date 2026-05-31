import { Container } from '@/components/Layout/Container';

export default function BlogArticleLoading() {
  return (
    <Container className="pt-20 pb-10 max-w-4xl mx-auto">
      <div className="h-4 w-24 bg-tertiary rounded animate-pulse mb-8" />
      <div className="aspect-video bg-tertiary rounded-xl animate-pulse mb-8" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 bg-tertiary rounded animate-pulse" />
        <div className="h-4 w-48 bg-tertiary rounded animate-pulse" />
        <div className="h-4 w-full bg-tertiary rounded animate-pulse mt-6" />
        <div className="h-4 w-full bg-tertiary rounded animate-pulse" />
        <div className="h-4 w-2/3 bg-tertiary rounded animate-pulse" />
      </div>
    </Container>
  );
}
