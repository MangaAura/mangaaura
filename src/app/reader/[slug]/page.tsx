import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false },
  };
}

export default async function ChapterReaderPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  // Old format: /reader/{slug}?chapter=N → /{slug}-N
  if (sp.chapter) {
    redirect(`/${slug}-${sp.chapter}`);
    return;
  }

  // Old format: /reader/{uuid} → /reader?chapterId={uuid} (client-side resolution)
  redirect(`/reader?chapterId=${slug}`);
}
