'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  ArrowLeft,
  Save,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  FileText,
  Star,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';

interface UserManga {
  id: string;
  title: string;
  status: string;
  chapterCount: number;
}

interface UserData {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  xpPoints: number;
  inkcoinsBalance: number;
  level: number;
  readingStreak: number;
  createdAt: string;
  lastReadAt: string | null;
  mangaCount: number;
  chapterCount: number;
  commentCount: number;
  mangas: UserManga[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditUserPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    inkcoinsBalance: user?.inkcoinsBalance || 0,
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
      console.error('Failed to save:', error);
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
      console.error('Failed to delete:', error);
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
      console.error('Failed to ban/unban:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--error)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Failed to load user</h2>
        <p className="text-[var(--text-tertiary)] mt-2">Please try again later</p>
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
              Edit User
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
            {user.role === 'BANNED' ? 'Unban User' : 'Ban User'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Email address"
                />
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
              <CardTitle>Gamification Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Level</label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">XP Points</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.xpPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, xpPoints: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)]">InkCoins</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.inkcoinsBalance}
                    onChange={(e) =>
                      setFormData({ ...formData, inkcoinsBalance: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Mangas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Created Mangas ({user.mangas.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.mangas.length === 0 ? (
                <p className="text-[var(--text-tertiary)] text-center py-8">No mangas created yet</p>
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
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center mb-4">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
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
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Level</span>
                <span className="font-medium">{user.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">XP Points</span>
                <span className="font-medium">{user.xpPoints.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">InkCoins</span>
                <span className="font-medium">{user.inkcoinsBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Reading Streak</span>
                <span className="font-medium">{user.readingStreak} days</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Mangas</span>
                  <span className="font-medium">{user.mangaCount}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Chapters</span>
                <span className="font-medium">{user.chapterCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Comments</span>
                <span className="font-medium">{user.commentCount}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Joined</span>
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
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This will permanently delete @{user.username} and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
