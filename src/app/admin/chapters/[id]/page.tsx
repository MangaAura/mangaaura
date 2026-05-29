'use client';

import { ArrowLeft, Save, FileText, Eye, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

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
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalle del Capítulo | MangaAura',
  description: 'Revisa y edita los detalles de un capítulo de manga en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Detalle del Capítulo | MangaAura',
    description: 'Revisa y edita los detalles de un capítulo de manga en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Detalle del Capítulo | MangaAura',
    description: 'Revisa los detalles de un capítulo en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/chapters/[id]' },
};

interface ChapterDetail {
  id: string;
  mangaId: string;
  manga: { id: string; title: string; slug: string; coverUrl: string | null; authorName: string };
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  pageUrls: string[];
  viewCount: number;
  status: string;
  isCrowdfunded: boolean;
  crowdfundingGoal: number | null;
  crowdfundingCurrent: number | null;
  scheduledAt: string | null;
  commentCount: number;
  _count: { comments: number; readingProgress: number };
  createdAt: string;
  updatedAt: string;
}

export default function EditChapterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = useT();
  const { handleError } = useErrorHandler();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ chapter: ChapterDetail }>(
    `/api/admin/chapters/${params.id}`,
    fetcher
  );

  const chapter = data?.chapter;

  const [formData, setFormData] = useState({
    title: chapter?.title || '',
    chapterNumber: chapter?.chapterNumber || 1,
    totalPages: chapter?.totalPages || 0,
    status: chapter?.status || 'PUBLISHED',
    pageUrls: chapter?.pageUrls?.join('\n') || '',
  });

  useState(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || '',
        chapterNumber: chapter.chapterNumber,
        totalPages: chapter.totalPages,
        status: chapter.status,
        pageUrls: Array.isArray(chapter.pageUrls) ? chapter.pageUrls.join('\n') : '',
      });
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/chapters/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pageUrls: formData.pageUrls.split('\n').filter(Boolean),
        }),
      });
      if (response.ok) {
        await mutate();
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/chapters/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/admin/chapters');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{t('admin.failedToLoad')}</h2>
        <p className="text-[var(--text-tertiary)] mt-2">{t('common.retry')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/chapters">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[var(--primary)]" />
              Edit Chapter
            </h1>
            <p className="text-[var(--text-muted)]">
              {chapter.manga.title} — Chapter {chapter.chapterNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/manga/${chapter.manga.slug}/chapter/${chapter.chapterNumber}`} target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" /> View
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chapter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Chapter Number</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.chapterNumber}
                    onChange={(e) => setFormData({ ...formData, chapterNumber: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Total Pages</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.totalPages}
                    onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Chapter title (optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Status</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Page URLs <span className="text-[var(--text-tertiary)]">(one per line)</span>
                </label>
                <Textarea
                  value={formData.pageUrls}
                  onChange={(e) => setFormData({ ...formData, pageUrls: e.target.value })}
                  placeholder="https://..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manga</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{chapter.manga.title}</p>
              <p className="text-sm text-[var(--text-tertiary)]">by {chapter.manga.authorName}</p>
              <Link href={`/admin/manga/${chapter.manga.id}`} className="text-sm text-[var(--primary)] hover:underline mt-2 inline-block">
                Edit Manga →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Views</span>
                <span className="font-medium">{chapter.viewCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Comments</span>
                <span className="font-medium">{chapter._count.comments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Reads</span>
                <span className="font-medium">{chapter._count.readingProgress}</span>
              </div>
              {chapter.isCrowdfunded && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Crowdfunding</span>
                  <span className="font-medium">
                    {chapter.crowdfundingCurrent}/{chapter.crowdfundingGoal}
                  </span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Created</span>
                  <span className="font-medium">{new Date(chapter.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              This will permanently delete this chapter and all associated comments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Chapter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
