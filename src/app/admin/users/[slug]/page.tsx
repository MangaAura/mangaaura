'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { useErrorHandler } from '@/hooks/useErrorHandler';import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalle de Usuario | MangaAura',
  description: 'Revisa y edita los detalles de un usuario en MangaAura.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Detalle de Usuario | MangaAura',
    description: 'Revisa y edita los detalles de un usuario en MangaAura.',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Detalle de Usuario | MangaAura',
    description: 'Revisa los detalles de un usuario en MangaAura.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: '/admin/users/[slug]' },
};

interface UserData {
  id: string;
  username: string;
  displayName?: string | null;
  email: string;
  role: string;
  avatarUrl?: string | null;
  level: number;
  xpPoints: number;
  auraBalance: number;
  readingStreak: number;
  createdAt: string;
  mangaCount: number;
  chapterCount: number;
  commentCount: number;
  mangas: Array<{
    id: string;
    title: string;
    chapterCount: number;
    status: string;
  }>;
}

export default function EditUserPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const t = useT();
  const { handleError } = useErrorHandler();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [levelTouched, setLevelTouched] = useState(false);
  const [levelError, setLevelError] = useState('');
  const [levelValid, setLevelValid] = useState(false);
  const [xpTouched, setXpTouched] = useState(false);
  const [xpError, setXpError] = useState('');
  const [xpValid, setXpValid] = useState(false);
  const [inkTouched, setInkTouched] = useState(false);
  const [inkError, setInkError] = useState('');
  const [inkValid, setInkValid] = useState(false);

  const validateLevelField = (value: number) => {
    if (value < 1) {
      setLevelError('Minimum 1');
      setLevelValid(false);
    } else {
      setLevelError('');
      setLevelValid(true);
    }
  };

  const validateXpField = (value: number) => {
    if (value < 0) {
      setXpError('Minimum 0');
      setXpValid(false);
    } else {
      setXpError('');
      setXpValid(true);
    }
  };

  const validateInkField = (value: number) => {
    if (value < 0) {
      setInkError('Minimum 0');
      setInkValid(false);
    } else {
      setInkError('');
      setInkValid(true);
    }
  };

  const validateEmailField = (value: string) => {
    if (!value) {
      setEmailError(t('admin.emailRequired'));
      setEmailValid(false);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError(t('admin.emailInvalid'));
      setEmailValid(false);
    } else {
      setEmailError('');
      setEmailValid(true);
    }
  };

  const { data, error, isLoading, mutate } = useSWR<{ user: UserData }>(
    `/api/admin/users/${params.slug}`,
    fetcher
  );

  const user = data?.user;

  const [formData, setFormData] = useState({
    username: user?.username || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    role: user?.role || 'USER',
    xpPoints: user?.xpPoints || 0,
    auraBalance: user?.auraBalance || 0,
    level: user?.level || 1,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${params.slug}`, {
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
      const response = await fetch(`/api/admin/users/${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });

      if (response.ok) {
        router.push('/admin/users');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBan = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${params.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: user?.role === 'BANNED' ? 'unban' : 'ban' }),
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (error || !user) {
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
          <Link href="/admin/users">
<Button variant="ghost" size="icon" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-6 h-6 text-[var(--primary)]" />
              {t('admin.editUser')}
            </h1>
            <p className="text-[var(--text-muted)]">@{user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={user.role === 'BANNED' ? 'outline' : 'secondary'}
            onClick={handleBan}
            disabled={isSaving}
          >
            {user.role === 'BANNED' ? t('admin.unbanUser') : t('admin.banUser')}
          </Button>
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
              <CardTitle>{t('admin.userInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Display Name</label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="Display name"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (emailTouched) validateEmailField(e.target.value);
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                    validateEmailField(formData.email);
                  }}
                  placeholder="Email address"
                />
                {emailTouched && (
                  <AnimatePresence>
                    {emailError ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1 flex items-start gap-1.5 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg"
                        role="alert"
                      >
                        <XCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--error)]">{emailError}</p>
                      </motion.div>
                    ) : emailValid ? (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        <p className="text-xs text-[var(--success)]">{t('admin.validEmail')}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Role</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.gamificationStats')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Level</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.level}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFormData({ ...formData, level: val });
                      if (levelTouched) validateLevelField(val);
                    }}
                    onBlur={() => {
                      setLevelTouched(true);
                      validateLevelField(formData.level);
                    }}
                  />
                  {levelTouched && (
                    <AnimatePresence>
                      {levelError ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-1 flex items-start gap-1.5 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg"
                          role="alert"
                        >
                          <XCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0 mt-0.5" />
                          <p className="text-xs text-[var(--error)]">{levelError}</p>
                        </motion.div>
                      ) : levelValid ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                          <p className="text-xs text-[var(--success)]">Valid level</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">XP Points</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.xpPoints}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, xpPoints: val });
                      if (xpTouched) validateXpField(val);
                    }}
                    onBlur={() => {
                      setXpTouched(true);
                      validateXpField(formData.xpPoints);
                    }}
                  />
                  {xpTouched && (
                    <AnimatePresence>
                      {xpError ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-1 flex items-start gap-1.5 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg"
                          role="alert"
                        >
                          <XCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0 mt-0.5" />
                          <p className="text-xs text-[var(--error)]">{xpError}</p>
                        </motion.div>
                      ) : xpValid ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                          <p className="text-xs text-[var(--success)]">Valid value</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Aura</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.auraBalance}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, auraBalance: val });
                      if (inkTouched) validateInkField(val);
                    }}
                    onBlur={() => {
                      setInkTouched(true);
                      validateInkField(formData.auraBalance);
                    }}
                  />
                  {inkTouched && (
                    <AnimatePresence>
                      {inkError ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="mt-1 flex items-start gap-1.5 p-2 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg"
                          role="alert"
                        >
                          <XCircle className="w-3.5 h-3.5 text-[var(--error)] shrink-0 mt-0.5" />
                          <p className="text-xs text-[var(--error)]">{inkError}</p>
                        </motion.div>
                      ) : inkValid ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                          <p className="text-xs text-[var(--success)]">Valid value</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Mangas */}
          <Card>
            <CardHeader>                <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {t('admin.createdMangas')} ({user.mangas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.mangas.length === 0 ? (
                <p className="text-[var(--text-tertiary)] text-center py-8">{t('admin.noMangasCreated')}</p>
              ) : (
                <div className="space-y-2">
                  {user.mangas.map((manga) => (
                    <Link key={manga.id} href={`/admin/manga/${manga.id}`}>
                      <div className="flex items-center justify-between p-3 bg-[var(--surface)] rounded-lg hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">{manga.title}</p>
                          <p className="text-sm text-[var(--text-tertiary)]">
                            {manga.chapterCount} chapters
                          </p>
                        </div>
                        <Badge
                          variant={manga.status === 'ONGOING' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {manga.status.toLowerCase()}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Avatar Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.profile')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center mb-4">
                  {user.avatarUrl ? (
                    <OptimizedImage
                      src={user.avatarUrl}
                      alt={user.username}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-[var(--text-tertiary)]">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-lg">
                  {user.displayName || user.username}
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">@{user.username}</p>
                <Badge
                  variant={user.role === 'ADMIN' ? 'destructive' : 'default'}
                  className="mt-2 capitalize"
                >
                  {user.role.toLowerCase()}
                </Badge>
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
                <span className="text-[var(--text-tertiary)]">{t('admin.level')}</span>
                <span className="font-medium">{user.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">{t('admin.xpPoints')}</span>
                <span className="font-medium">{user.xpPoints.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">{t('admin.aura')}</span>
                <span className="font-medium">{user.auraBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">{t('admin.readingStreak')}</span>
                <span className="font-medium">{user.readingStreak} {t('admin.days')}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">{t('admin.mangasCreated')}</span>
                  <span className="font-medium">{user.mangaCount}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">{t('admin.chapters')}</span>
                <span className="font-medium">{user.chapterCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">{t('admin.comments')}</span>
                <span className="font-medium">{user.commentCount}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">{t('admin.joined')}</span>
                  <span className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
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
            <DialogTitle>{t('admin.deleteUser')}</DialogTitle>
            <DialogDescription>
              {t('admin.deleteUserDesc')}
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
              {t('admin.deleteUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
