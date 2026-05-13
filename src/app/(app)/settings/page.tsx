import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { SettingsTabs } from '@/components/Settings/SettingsTabs';

export const metadata: Metadata = {
  title: 'Configuración | Inkverse',
  description: 'Configura tu cuenta y preferencias',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/settings');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      emailPreferences: true,
    },
  });

  if (!user) {
    redirect('/auth/login');
  }

  // Parse email preferences
  let emailPrefs = {
    newsletter: true,
    newFollowers: true,
    newComments: true,
    chapterUpdates: true,
    achievements: true,
    marketing: false,
  };

  try {
    if (user.emailPreferences) {
      const parsed = JSON.parse(user.emailPreferences);
      emailPrefs = { ...emailPrefs, ...parsed };
    }
  } catch {
    // Use defaults
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Configuración</h1>
      <p className="text-[var(--text-secondary)]">
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        <SettingsTabs
          user={{
            ...user,
            emailPreferences: emailPrefs,
          }}
        />
      </div>
    </div>
  );
}
