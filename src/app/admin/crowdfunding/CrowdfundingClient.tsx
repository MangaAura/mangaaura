'use client';

import { XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
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

export default function CrowdfundingClient() {
  const t = useT();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [selectedCampaign, setSelectedCampaign] = useState<CrowdfundingData | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    crowdfunding: CrowdfundingData[];
    sponsorshipBids: SponsorshipBidData[];
    totals: TotalsData;
  }>('/api/admin/crowdfunding', fetcher, { refreshInterval: 30000 });

  const handleCancelCampaign = async () => {
    if (!selectedCampaign) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/admin/crowdfunding/${selectedCampaign.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });

      if (res.ok) {
        await mutate();
        setShowCancelDialog(false);
        setSelectedCampaign(null);
        setCancelReason('');
        toast({
          title: 'Campaign cancelled',
          description: `Campaign for ${selectedCampaign.manga.title} Ch. ${selectedCampaign.chapterNumber} has been cancelled.`,
          variant: 'success',
        });
      } else {
        const err = await res.json();
        toast({
          title: 'Error',
          description: err.error || 'Failed to cancel campaign',
          variant: 'error',
        });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('admin.pages.crowdfunding.title')}</h1>
        <p className="text-[var(--text-muted)]">{t('admin.pages.crowdfunding.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.crowdfunding.loadError')}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="h-full">
              <CardHeader><CardTitle className="text-sm">{t('admin.pages.crowdfunding.crowdfundingRaised')}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-[var(--accent-purple)]">{data?.totals.crowdfundingRaised.toLocaleString()} Aura</p></CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader><CardTitle className="text-sm">{t('admin.pages.crowdfunding.activeCampaigns')}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data?.totals.crowdfundingCount}</p></CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader><CardTitle className="text-sm">{t('admin.pages.crowdfunding.sponsorshipTotal')}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold text-[var(--accent-orange)]">{data?.totals.sponsorshipTotal.toLocaleString()} Aura</p></CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader><CardTitle className="text-sm">{t('admin.pages.crowdfunding.totalBids')}</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{data?.totals.sponsorshipCount}</p></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="crowdfunding">
            <TabsList>
              <TabsTrigger value="crowdfunding">{t('admin.pages.crowdfunding.tabs.campaigns')}</TabsTrigger>
              <TabsTrigger value="sponsorships">{t('admin.pages.crowdfunding.tabs.sponsorships')}</TabsTrigger>
            </TabsList>

            <TabsContent value="crowdfunding" className="space-y-4 mt-4">
              {data?.crowdfunding.length === 0 ? (
                <p className="text-center py-8 text-[var(--text-tertiary)]">{t('admin.pages.crowdfunding.noCampaigns')}</p>
              ) : (
                data?.crowdfunding.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.manga.title} — Ch. {c.chapterNumber}{c.title ? `: ${c.title}` : ''}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">{t('admin.pages.crowdfunding.by', { author: c.manga.authorName })}</p>
                        <div className="mt-2">
                          <div className="w-48 h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--accent-purple)] rounded-full"
                              style={{ width: `${c.goal ? Math.min(100, (c.current || 0) / c.goal * 100) : 0}%` }}
                            />
                          </div>
                          <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {t('admin.pages.crowdfunding.progress', { current: c.current?.toLocaleString() || 0, goal: c.goal?.toLocaleString() || 0, count: c.contributorsCount })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCampaign(c);
                            setCancelReason('');
                            setShowCancelDialog(true);
                          }}
                          title="Cancel campaign"
                        >
                          <XCircle className="w-4 h-4 text-[var(--error)]" />
                        </Button>
                        <span className="text-sm text-[var(--text-tertiary)]">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="sponsorships" className="space-y-4 mt-4">
              {data?.sponsorshipBids.length === 0 ? (
                <p className="text-center py-8 text-[var(--text-tertiary)]">{t('admin.pages.crowdfunding.noBids')}</p>
              ) : (
                data?.sponsorshipBids.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {b.chapter.manga.title} — Ch. {b.chapter.chapterNumber}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {t('admin.pages.crowdfunding.by', { author: b.user.displayName || b.user.username })} — {b.bidAmount.toLocaleString()} Aura
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={b.isWinning ? 'success' : b.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {b.isWinning ? t('admin.pages.crowdfunding.winning') : b.status}
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

      {/* Cancel Campaign Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[var(--error)]" />
              Cancel Campaign
            </DialogTitle>
            <DialogDescription>
              {selectedCampaign && (
                <>This will cancel the crowdfunding campaign for <strong>{selectedCampaign.manga.title} — Ch. {selectedCampaign.chapterNumber}</strong>. Contributors will be refunded.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Reason (optional)</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Why is this campaign being cancelled?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelCampaign}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
