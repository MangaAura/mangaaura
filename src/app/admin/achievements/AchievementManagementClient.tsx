'use client';

import { Trophy, Plus, Save, Trash2, Loader2, Award, Search, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
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
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface AchievementData {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  condition: string;
  category: string;
  difficulty: string;
  unlockCount: number;
  totalUsers: number;
  createdAt: string;
}

interface UserResult {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
}

export default function AchievementManagementClient() {
  const { handleError } = useErrorHandler();
  const t = useT();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantAchievement, setGrantAchievement] = useState<AchievementData | null>(null);
  const [grantSearch, setGrantSearch] = useState('');
  const [grantUserId, setGrantUserId] = useState<string | null>(null);
  const [isGranting, setIsGranting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ achievements: AchievementData[] }>(
    '/api/admin/achievements',
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: grantUsers, isValidating: searchingUsers } = useSWR<{ users: UserResult[] }>(
    grantSearch.length >= 2 ? `/api/admin/users?search=${encodeURIComponent(grantSearch)}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const achievements = data?.achievements || [];

  const [formData, setFormData] = useState({
    badgeId: '',
    name: '',
    description: '',
    iconUrl: '',
    xpReward: 50,
    condition: '{"type":"CHAPTERS_READ","count":10}',
    category: 'general',
    difficulty: 'EASY',
  });

  const resetForm = () => {
    setFormData({
      badgeId: '',
      name: '',
      description: '',
      iconUrl: '',
      xpReward: 50,
      condition: '{"type":"CHAPTERS_READ","count":10}',
      category: 'general',
      difficulty: 'EASY',
    });
  };

  const openEdit = (achievement: AchievementData) => {
    setEditingAchievement(achievement);
    setFormData({
      badgeId: achievement.badgeId,
      name: achievement.name,
      description: achievement.description,
      iconUrl: achievement.iconUrl || '',
      xpReward: achievement.xpReward,
      condition: achievement.condition,
      category: achievement.category,
      difficulty: achievement.difficulty,
    });
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = editingAchievement
        ? `/api/admin/achievements/${editingAchievement.id}`
        : '/api/admin/achievements';
      const method = editingAchievement ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await mutate();
        setShowCreateDialog(false);
        setEditingAchievement(null);
        resetForm();
        toast({ title: editingAchievement ? 'Achievement updated' : 'Achievement created', variant: 'success' });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.error || 'Failed to save', variant: 'destructive' });
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'Failed to save achievement', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAchievement) return;
    try {
      const response = await fetch(`/api/admin/achievements/${editingAchievement.id}`, { method: 'DELETE' });
      if (response.ok) {
        await mutate();
        setShowDeleteDialog(false);
        setEditingAchievement(null);
        toast({ title: 'Achievement deleted', variant: 'success' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleGrant = async () => {
    if (!grantAchievement || !grantUserId) return;
    setIsGranting(true);
    try {
      const response = await fetch(`/api/admin/achievements/${grantAchievement.id}/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: grantUserId }),
      });
      if (response.ok) {
        await mutate();
        setShowGrantDialog(false);
        setGrantAchievement(null);
        setGrantUserId(null);
        setGrantSearch('');
        toast({ title: 'Achievement granted', description: `${grantAchievement.name} granted successfully`, variant: 'success' });
      } else {
        const err = await response.json();
        toast({ title: 'Error', description: err.error || 'Failed to grant', variant: 'destructive' });
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'Failed to grant achievement', variant: 'destructive' });
    } finally {
      setIsGranting(false);
    }
  };

  const difficultyColors: Record<string, string> = {
    EASY: 'bg-green-500',
    MEDIUM: 'bg-blue-500',
    HARD: 'bg-purple-500',
    LEGENDARY: 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.achievements.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.achievements.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingAchievement(null); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> {t('admin.pages.achievements.newAchievement')}
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.achievements.loadError')}</div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">{t('admin.pages.achievements.empty')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <Card key={a.id} className="h-full flex flex-col">
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-lg ${difficultyColors[a.difficulty] || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{a.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{a.badgeId}</Badge>
                      <Badge variant="secondary" className="text-xs">{a.difficulty}</Badge>
                      <span className="text-xs text-[var(--text-tertiary)]">{a.xpReward} XP</span>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {a.unlockCount}/{a.totalUsers} ({a.totalUsers ? Math.round(a.unlockCount / a.totalUsers * 100) : 0}%)
                      </p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { openEdit(a); }} title="Edit">
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { setGrantAchievement(a); setGrantSearch(''); setGrantUserId(null); setShowGrantDialog(true); }} title="Grant to user">
                          <Award className="w-3.5 h-3.5 text-[var(--primary)]" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={(o) => { setShowCreateDialog(o); if (!o) { setEditingAchievement(null); resetForm(); }}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAchievement ? t('admin.pages.achievements.editTitle') : t('admin.pages.achievements.createTitle')}</DialogTitle>
            <DialogDescription>{editingAchievement ? t('admin.pages.achievements.editDesc') : t('admin.pages.achievements.createDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.badgeId')}</label>
                <Input value={formData.badgeId} onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })} placeholder={t('admin.pages.achievements.fields.badgeIdPlaceholder')} disabled={!!editingAchievement} />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.xpReward')}</label>
                <Input type="number" min={1} value={formData.xpReward} onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 50 })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.name')}</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('admin.pages.achievements.fields.namePlaceholder')} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.description')}</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.category')}</label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder={t('admin.pages.achievements.fields.categoryPlaceholder')} />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.difficulty')}</label>
                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">{t('admin.pages.achievements.difficulty.EASY')}</SelectItem>
                    <SelectItem value="MEDIUM">{t('admin.pages.achievements.difficulty.MEDIUM')}</SelectItem>
                    <SelectItem value="HARD">{t('admin.pages.achievements.difficulty.HARD')}</SelectItem>
                    <SelectItem value="LEGENDARY">{t('admin.pages.achievements.difficulty.LEGENDARY')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.achievements.fields.condition')}</label>
              <Textarea
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                rows={3}
                placeholder={t('admin.pages.achievements.fields.conditionPlaceholder')}
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('admin.pages.achievements.fields.conditionHint')}</p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div>
              {editingAchievement && (
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> {t('admin.pages.achievements.confirmDelete')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingAchievement(null); resetForm(); }}>{t('admin.pages.achievements.cancel')}</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingAchievement ? t('admin.pages.achievements.update') : t('admin.pages.achievements.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.achievements.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.achievements.deleteDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('admin.pages.achievements.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> {t('admin.pages.achievements.confirmDelete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showGrantDialog} onOpenChange={(o) => { setShowGrantDialog(o); if (!o) { setGrantAchievement(null); setGrantUserId(null); setGrantSearch(''); }}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--primary)]" />
              Grant Achievement
            </DialogTitle>
            <DialogDescription>
              Search for a user and manually grant &quot;{grantAchievement?.name}&quot; to them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <Input
                placeholder="Search by username or email..."
                value={grantSearch}
                onChange={(e) => setGrantSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchingUsers && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
              </div>
            )}
            {grantUsers?.users && grantUsers.users.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                {grantUsers.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setGrantUserId(u.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${grantUserId === u.id ? 'bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]' : 'hover:bg-[var(--surface-sunken)]'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--surface-sunken)] flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-[var(--text-tertiary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{u.email}</p>
                    </div>
                    {grantUserId === u.id && <Badge className="ml-auto">Selected</Badge>}
                  </button>
                ))}
              </div>
            )}
            {grantSearch.length >= 2 && (!grantUsers?.users || grantUsers.users.length === 0) && !searchingUsers && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">No users found</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGrantDialog(false); setGrantAchievement(null); setGrantUserId(null); setGrantSearch(''); }}>Cancel</Button>
            <Button onClick={handleGrant} disabled={!grantUserId || isGranting}>
              {isGranting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
              Grant Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
