'use client';

import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { ClanChatInterface } from '@/components/Messages/ClanChatInterface';
import { Button } from '@/components/ui/Button';

interface ClanInfo {
  id: string;
  name: string;
  emblemUrl: string | null;
  description: string | null;
  memberCount: number;
}

export function ClanChatClient({
  clanId,
  currentUserId,
}: {
  clanId: string;
  currentUserId: string;
}) {
  const [clan, setClan] = useState<ClanInfo | null>(null);
  const [userRole, setUserRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [clanRes, memberRes] = await Promise.all([
          fetch(`/api/clans/${clanId}`),
          fetch('/api/user/clan'),
        ]);

        if (clanRes.ok) {
          const clanData = await clanRes.json();
          const c = clanData.clan || clanData;
          setClan({
            id: c.id,
            name: c.name,
            emblemUrl: c.emblemUrl || null,
            description: c.description || null,
            memberCount: c.memberCount || c._count?.members || 0,
          });
        }

        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setUserRole(memberData.role || 'MEMBER');
        }
      } catch {
        // silent
      }
      setLoading(false);
    })();
  }, [clanId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Users className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-4" />
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Clan no encontrado
          </h1>
          <p className="text-[var(--text-tertiary)] mb-4">
            Este clan no existe o no tienes acceso.
          </p>
          <Link href="/messages">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a mensajes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mensajes
          </Link>
        </div>
        <div className="h-[calc(100dvh-180px)] min-h-[500px]">
          <ClanChatInterface
            clanId={clan.id}
            currentUserId={currentUserId}
            clan={clan}
            currentUserRole={userRole}
          />
        </div>
      </div>
    </div>
  );
}
