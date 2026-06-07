import { Activity, Globe, Users, Sparkles } from 'lucide-react';
import { Metadata } from 'next';

import { SuggestedUsers } from '@/components/Social/SuggestedUsers';
import { ActivityFeed } from '@/components/Activity/ActivityFeed';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await detectLocale();
  const t = getT(locale);
  const title = t('page.feed.title');
  const description = t('page.feed.description');

  return {
    title,
    description,
  };
}

export default async function FeedPage() {
  const session = await auth();
  const locale = await detectLocale();
  const t = getT(locale);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-20 pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Activity className="text-[var(--primary)]" size={30} /> {t('feed.title')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          {t('feed.subtitle')}
        </p>
      </div>

      <Tabs defaultValue={session?.user?.id ? 'algorithmic' : 'global'}>
        <TabsList className="mb-6">
          <TabsTrigger value="algorithmic" className="flex items-center gap-2" disabled={!session?.user?.id}>
            <Sparkles className="w-4 h-4" />
            Para ti
          </TabsTrigger>
          <TabsTrigger value="following" className="flex items-center gap-2" disabled={!session?.user?.id}>
            <Users className="w-4 h-4" />
            Siguiendo
          </TabsTrigger>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Global
          </TabsTrigger>
          {session?.user?.id && (
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Mi actividad
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="algorithmic">
          {session?.user?.id ? (
            <ActivityFeed userId={session.user.id} type="algorithmic" />
          ) : (
            <Card className="p-8 text-center border border-[var(--border)] bg-[var(--surface)]">
              <p className="text-[var(--text-secondary)] mb-4">
                Inicia sesión para ver tu feed personalizado
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="following">
          {session?.user?.id ? (
            <ActivityFeed userId={session.user.id} type="following" />
          ) : (
            <Card className="p-8 text-center border border-[var(--border)] bg-[var(--surface)]">
              <p className="text-[var(--text-secondary)] mb-4">
                Inicia sesión para ver la actividad de quienes sigues
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="global">
          <ActivityFeed type="global" />
        </TabsContent>

        {session?.user?.id && (
          <TabsContent value="personal">
            <ActivityFeed userId={session.user.id} type="personal" />
          </TabsContent>
        )}
      </Tabs>

      {/* Suggested Users — shown when user is logged in */}
      {session?.user?.id && (
        <div className="mt-8">
          <SuggestedUsers />
        </div>
      )}
    </div>
  );
}
