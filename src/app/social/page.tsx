import { Activity, Globe, Sparkles, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

import { ActivityFeed } from '@/components/Activity/ActivityFeed';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { getT } from '@/i18n/getT';
import { detectLocale } from '@/i18n/server';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Social | Inkverse',
  description: 'Descubre nuevos usuarios, creadores y contenido popular en la comunidad',
};

export default async function SocialPage() {
  const session = await auth();
  const locale = await detectLocale();
  const t = getT(locale);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-20 pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <Sparkles className="text-[var(--primary)]" size={30} />
          {t('social.title')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          {t('social.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="discover">
        <TabsList className="mb-6">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('social.discover')}
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {t('social.trending')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('social.globalActivity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover">
          <div className="space-y-6">
            <Card className="p-6 border border-[var(--border)] bg-[var(--surface)]">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                {t('social.recommendedUsers')}
              </h2>
              <ActivityFeed type="global" />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trending">
          <div className="space-y-6">
            <Card className="p-6 border border-[var(--border)] bg-[var(--surface)]">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--accent-red)]" />
                {t('social.trendingContent')}
              </h2>
              <ActivityFeed type="global" />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="space-y-6">
            {session?.user?.id ? (
              <ActivityFeed userId={session.user.id} type="global" />
            ) : (
              <Card className="p-8 text-center border border-[var(--border)] bg-[var(--surface)]">
                <p className="text-[var(--text-secondary)] mb-4">
                  {t('social.loginPrompt')}
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
