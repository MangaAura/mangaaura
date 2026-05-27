'use client';

import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { fetcher } from '@/lib/swr-config';

interface CrowdfundingData {
  id: string;
  manga: { id: string; title: string; slug: string; coverUrl: string | null; authorName: string };
  chapterNumber: number;
  title: string | null;
  goal: number | null;
  current: number | null;
  contributorsCount: number;
  createdAt: string;
}

interface SponsorshipBidData {
  id: string;
  chapter: { id: string; chapterNumber: number; mangaId: string; manga: { id: string; title: string; slug: string } };
  user: { id: string; username: string; displayName: string | null };
  bidAmount: number;
  status: string;
  isWinning: boolean;
  createdAt: string;
}

interface TotalsData {
  crowdfundingRaised: number;
  sponsorshipTotal: number;
  crowdfundingCount: number;
  sponsorshipCount: number;
}

export default function CrowdfundingPage() {
  const { data, error, isLoading } = useSWR<{
    crowdfunding: CrowdfundingData[];
    sponsorshipBids: SponsorshipBidData[];
    totals: TotalsData;
  }>('/api/admin/crowdfunding', fetcher, { refreshInterval: 30000 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Crowdfunding & Sponsorships</h1>
        <p className="text-[var(--text-muted)]">Monitor all crowdfunding campaigns and sponsorship bids</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">Failed to load data</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Crowdfunding Raised</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-[var(--accent-purple)]">{data?.totals.crowdfundingRaised.toLocaleString()} Aura</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Active Campaigns</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data?.totals.crowdfundingCount}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Sponsorship Total</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-[var(--accent-orange)]">{data?.totals.sponsorshipTotal.toLocaleString()} Aura</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Total Bids</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data?.totals.sponsorshipCount}</p></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="crowdfunding">
            <TabsList>
              <TabsTrigger value="crowdfunding">Crowdfunding Campaigns</TabsTrigger>
              <TabsTrigger value="sponsorships">Sponsorship Bids</TabsTrigger>
            </TabsList>

            <TabsContent value="crowdfunding" className="space-y-4 mt-4">
              {data?.crowdfunding.length === 0 ? (
                <p className="text-center py-8 text-[var(--text-tertiary)]">No crowdfunding campaigns</p>
              ) : (
                data?.crowdfunding.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.manga.title} — Ch. {c.chapterNumber}{c.title ? `: ${c.title}` : ''}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">by {c.manga.authorName}</p>
                        <div className="mt-2">
                          <div className="w-48 h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent-purple)] rounded-full"
                              style={{ width: `${c.goal ? Math.min(100, (c.current || 0) / c.goal * 100) : 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {c.current?.toLocaleString() || 0} / {c.goal?.toLocaleString() || 0} Aura ({c.contributorsCount} contributors)
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-[var(--text-tertiary)]">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="sponsorships" className="space-y-4 mt-4">
              {data?.sponsorshipBids.length === 0 ? (
                <p className="text-center py-8 text-[var(--text-tertiary)]">No sponsorship bids</p>
              ) : (
                data?.sponsorshipBids.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {b.chapter.manga.title} — Ch. {b.chapter.chapterNumber}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          by {b.user.displayName || b.user.username} — {b.bidAmount.toLocaleString()} Aura
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={b.isWinning ? 'success' : b.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {b.isWinning ? 'Winning' : b.status}
                        </Badge>
                        <span className="text-sm text-[var(--text-tertiary)]">{new Date(b.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
