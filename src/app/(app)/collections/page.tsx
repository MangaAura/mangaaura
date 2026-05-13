import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import { CollectionGrid } from '@/components/Collections/CollectionGrid';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export const metadata: Metadata = {
  title: 'Colecciones | Inkverse',
  description: 'Explora y descubre colecciones de manga creadas por la comunidad',
  openGraph: {
    title: 'Colecciones | Inkverse',
    description: 'Explora colecciones de manga organizadas por la comunidad',
  },
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const { filter = 'all' } = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Colecciones</h1>
        <p className="text-[var(--text-secondary)]">
              Descubre y organiza tus mangas favoritos
            </p>
          </div>
        </div>

        <Tabs defaultValue={filter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" asChild>
              <a href="/collections?filter=all" className="cursor-pointer">Todas</a>
            </TabsTrigger>
            <TabsTrigger value="public" asChild>
              <a href="/collections?filter=public" className="cursor-pointer">Públicas</a>
            </TabsTrigger>
            {session?.user?.id && (
              <TabsTrigger value="private" asChild>
                <a href="/collections?filter=private" className="cursor-pointer">Mis colecciones</a>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <CollectionGrid
          filter={filter as 'all' | 'public' | 'private'}
          currentUserId={session?.user?.id}
        />
      </div>
    </div>
  );
}
