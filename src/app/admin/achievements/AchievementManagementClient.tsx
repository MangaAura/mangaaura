'use client';

import { Trophy, Plus, Save, Trash2, Loader2 } from 'lucide-react';
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
import { useErrorHandler } from '@/hooks/useErrorHandler';
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

export default function AchievementManagementClient() {
  const { handleError } = useErrorHandler();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{ achievements: AchievementData[] }>(
    '/api/admin/achievements',
    fetcher,
    { refreshInterval: 30000 }
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
      }
    } catch (error) {
      handleError(error);
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
      }
    } catch (error) {
      handleError(error);
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
            Achievement Definitions
          </h1>
          <p className="text-[var(--text-muted)]">Create and manage achievement badges</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingAchievement(null); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Achievement
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">Failed to load achievements</div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">No achievements defined</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <Card key={a.id} className="cursor-pointer hover:ring-1 hover:ring-[var(--primary)]" onClick={() => openEdit(a)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${difficultyColors[a.difficulty] || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">{a.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{a.badgeId}</Badge>
                      <Badge variant="secondary" className="text-xs">{a.difficulty}</Badge>
                      <span className="text-xs text-[var(--text-tertiary)]">{a.xpReward} XP</span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {a.unlockCount}/{a.totalUsers} users unlocked ({a.totalUsers ? Math.round(a.unlockCount / a.totalUsers * 100) : 0}%)
                    </p>
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
            <DialogTitle>{editingAchievement ? 'Edit Achievement' : 'Create Achievement'}</DialogTitle>
            <DialogDescription>Define a new achievement badge and its unlock conditions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Badge ID</label>
                <Input value={formData.badgeId} onChange={(e) => setFormData({ ...formData, badgeId: e.target.value })} placeholder="e.g. first_chapter" disabled={!!editingAchievement} />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">XP Reward</label>
                <Input type="number" min={1} value={formData.xpReward} onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 50 })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Achievement name" />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="general" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Difficulty</label>
                <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                    <SelectItem value="LEGENDARY">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Condition (JSON)</label>
              <Textarea
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                rows={3}
                placeholder='{"type":"CHAPTERS_READ","count":100}'
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Types: CHAPTERS_READ, MANGAS_CREATED, MANGAS_COMPLETED, LEVEL_REACHED, STREAK_DAYS, QUESTS_COMPLETED, COMMENTS_POSTED, LIKES_RECEIVED, CORRECTIONS_APPROVED, SPONSORSHIPS_WON</p>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div>
              {editingAchievement && (
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingAchievement(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingAchievement ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Achievement</DialogTitle>
            <DialogDescription>This will permanently delete this achievement definition. Users who already unlocked it will lose it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
