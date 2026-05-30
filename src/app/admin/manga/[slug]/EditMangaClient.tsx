'use client';

import {
  ArrowLeft,
  Save,
  BookOpen,
  Eye,
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  AlertTriangle,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
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
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface MangaChapter {
  id: string;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

interface MangaAuthor {
  avatarUrl: string | null;
  username: string;
}

interface MangaData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  status: string;
  tags: string[];
  authorName: string;
  author: MangaAuthor;
  chapters: MangaChapter[];
  totalViews: number;
  bookmarkCount: number;
  commentCount: number;
  rating: number | null;
  createdAt: string;
}

export default function EditMangaClient({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const t = useT();
  const { handleError } = useErrorHandler();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [_coverFile, setCoverFile] = useState<File | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ manga: MangaData }>(
    `/api/admin/manga/${params.slug}`,
    fetcher
  );

  const manga = data?.manga;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverUrl: '',
    status: 'ONGOING',
    tags: [] as string[],
  });

  // Populate form when manga data loads from SWR
  const dataInitialized = useRef(false);
  useEffect(() => {
    if (manga && !dataInitialized.current) {
      dataInitialized.current = true;
      const timer = setTimeout(() => {
        setFormData({
          title: manga.title,
          description: manga.description || '',
          coverUrl: manga.coverUrl || '',
          status: manga.status,
          tags: manga.tags,
        });
        setCoverPreview(manga.coverUrl || null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [manga]);

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    setCoverFile(file);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      const res = await fetch('/api/upload/image', { method: 'POST', body: uploadForm });
      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.url || data.imageUrl;
        if (uploadedUrl) {
          setFormData((prev) => ({ ...prev, coverUrl: uploadedUrl }));
        }
      }
    } catch {
      // Upload failed, but local preview still shows
    }
  };

  const handleRemoveCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
    setFormData((prev) => ({ ...prev, coverUrl: '' }));
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/manga/${params.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      const response = await fetch(`/api/admin/manga/${params.slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/manga');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim().toLowerCase()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (error || !manga) {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/manga">
<Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              {t('admin.edit')}
            </h1>
            <p className="text-[var(--text-muted)]">{manga.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/manga/${manga.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Public Page
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('admin.delete')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('admin.saveChanges')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.mangaManagement')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Manga title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Manga description"
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Cover Image</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={formData.coverUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, coverUrl: e.target.value });
                        setCoverPreview(e.target.value || null);
                      }}
                      placeholder="https://..."
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <ImageIcon className="w-4 h-4 mr-1" />
                        Subir archivo
                      </Button>
                      {coverPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCover}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      className="hidden"
                    />
                    {/* Inline preview */}
                    {coverPreview && (
                      <div className="relative w-32 aspect-[3/4] rounded-lg overflow-hidden border border-[var(--border)]">
                        <Image
                          src={coverPreview}
                          alt="Cover preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="HIATUS">Hiatus</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Tags</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('admin.chapters')} ({manga.chapters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {manga.chapters.length === 0 ? (
                <p className="text-[var(--text-tertiary)] text-center py-8">{t('manga.noChapters')}</p>
              ) : (
                <div className="space-y-2">
                  {manga.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Chapter {chapter.chapterNumber}
                          {chapter.title && `: ${chapter.title}`}
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {chapter.totalPages} pages • {chapter.viewCount.toLocaleString()} views •{' '}
                          {chapter.commentCount} comments
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)]">
                          {new Date(chapter.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cover Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[3/4] bg-[var(--surface-sunken)] rounded-lg overflow-hidden">
                {formData.coverUrl ? (
                  <OptimizedImage
                    src={formData.coverUrl}
                    alt={formData.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-[var(--text-primary)]" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle>Author</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
                  {manga.author.avatarUrl ? (
                    <OptimizedImage
                      src={manga.author.avatarUrl}
                      alt={manga.authorName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {manga.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{manga.authorName}</p>
                  <p className="text-sm text-[var(--text-tertiary)]">@{manga.author.username}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.statistics')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Total Views</span>
                <span className="font-medium">
                  {manga.totalViews.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Bookmarks</span>
                <span className="font-medium">
                  {manga.bookmarkCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Comments</span>
                <span className="font-medium">
                  {manga.commentCount.toLocaleString()}
                </span>
              </div>
              {manga.rating && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Rating</span>
                  <span className="font-medium">{manga.rating.toFixed(1)}/10</span>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Created</span>
                  <span className="font-medium">
                    {new Date(manga.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.deleteManga')}</DialogTitle>
            <DialogDescription>
              {t('admin.deleteMangaDesc')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              {t('admin.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {t('admin.deleteManga')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
