import { Activity, Globe, Users } from 'lucide-react';
import type { Metadata } from 'next';

import { ActivityFeed } from '@/components/Activity/ActivityFeed';
import { Card } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { auth } from '@/lib/auth';


export const metadata: Metadata = {
  title: 'Actividad | Inkverse',
  description: 'Mira lo que está pasando en la comunidad',
};

export default async function FeedPage() {
  const session = await auth();

  return (
    <div className="max-w-3xl mx-auto space-y-10 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 mt-4">
          Actividad <Activity className="text-accent-purple" size={24} />
        </h1>
        <p className="text-[var(--text-secondary)] mt-2">
          Mira lo que está pasando en la comunidad
        </p>
      </div>

      <Tabs defaultValue="following">
        <TabsList className="mb-6">
          <TabsTrigger value="following" className="flex items-center gap-2">
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
    </div>
  );
}
