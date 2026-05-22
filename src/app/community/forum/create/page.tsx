import { ArrowLeft, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { NewThreadForm } from './NewThreadForm';
import { Card } from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export const metadata: Metadata = {
  title: 'Nuevo Hilo | Foro | MangaAura',
  description: 'Crear un nuevo hilo en el foro',
};

async function getCategories() {
  return prisma.forumCategory.findMany({
    orderBy: { order: 'asc' },
  });
}

export default async function NewThreadPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/community/forum/create');
  }

  const role = session.user.role;
  if (role !== 'CREATOR' && role !== 'ADMIN') {
    redirect('/community/forum');
  }

  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 pt-20 pb-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/community/forum"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al foro
        </Link>

        <Card className="p-6">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 mb-2">
            <MessageSquare className="text-[var(--primary)]" size={30} /> Nuevo Hilo
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
                Crea un nuevo tema de discusión en el foro
              </p>

          <NewThreadForm categories={categories} />
        </Card>
      </div>
    </div>
  );
}