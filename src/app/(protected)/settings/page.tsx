import { Settings } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SettingsTabs } from '@/components/Settings/SettingsTabs';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Configuración | MangaAura',
  description: 'Configura tu cuenta y preferencias',
};

export default async function SettingsPage() {
  const session = await auth();
  const locale = await detectLocale();
  const t = getT(locale);

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
      coverUrl: true,
      emailPreferences: true,
      bio: true,
      website: true,
      socialLinks: true,
    },
  });

  if (!user) {
    redirect('/auth/login');
  }

  // Parse email preferences
  let emailPrefs = {
    newsletter: true,
    newFollowers: true,
    commentReplies: true,
    commentLikes: true,
    newComments: true,
    commentMentions: true,
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
    <div className="container mx-auto px-4 pt-20 pb-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Settings className="text-[var(--primary)]" size={30} /> {t('settings.title')}
          </h1>
      <p className="text-[var(--text-secondary)]">
            {t('settings.description')}
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
