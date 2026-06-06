'use client';

import { Shield, Plus, Save, Trash2, Loader2, Users, Check, Copy, Search as SearchIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useT } from '@/i18n';
import { fetcher } from '@/lib/swr-config';

interface PermissionData {
  id: string;
  codename: string;
  description: string | null;
  module: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  priority: number;
  permissionIds: string[];
  userCount: number;
  createdAt: string;
}

interface RolesResponse {
  roles: RoleData[];
  permissions: PermissionData[];
  modules: string[];
}

export default function RolesClient() {
  const { handleError } = useErrorHandler();
  const t = useT();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');

  const { data, error, isLoading, mutate } = useSWR<RolesResponse>(
    '/api/admin/roles',
    fetcher,
    { refreshInterval: 30000 }
  );

  const roles = data?.roles || [];
  const permissions = data?.permissions || [];
  const modules = data?.modules || [];

  const openEdit = (role: RoleData) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissionIds);
    setPermSearch('');
    setShowCreateDialog(true);
  };

  const openDuplicate = (role: RoleData) => {
    setEditingRole(null);
    setRoleName(role.name + ' (copy)');
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissionIds);
    setPermSearch('');
    setShowCreateDialog(true);
    toast({ title: 'Role duplicated', description: 'Edit the copy details and save.', variant: 'default' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingRole) {
        const response = await fetch(`/api/admin/roles/${editingRole.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roleName, description: roleDescription, permissionIds: selectedPermissions }),
        });
        if (response.ok) {
          await mutate();
          setShowCreateDialog(false);
          setEditingRole(null);
          toast({ title: 'Role updated', variant: 'success' });
        } else {
          const err = await response.json();
          toast({ title: 'Error', description: err.error || 'Failed to update', variant: 'destructive' });
        }
      } else {
        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roleName, description: roleDescription, permissionIds: selectedPermissions }),
        });
        if (response.ok) {
          await mutate();
          setShowCreateDialog(false);
          toast({ title: 'Role created', variant: 'success' });
        } else {
          const err = await response.json();
          toast({ title: 'Error', description: err.error || 'Failed to create', variant: 'destructive' });
        }
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'Failed to save role', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRole) return;
    try {
      const response = await fetch(`/api/admin/roles/${editingRole.id}`, { method: 'DELETE' });
      if (response.ok) {
        await mutate();
        setShowDeleteDialog(false);
        setEditingRole(null);
        toast({ title: 'Role deleted', variant: 'success' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' });
      }
    } catch (error) {
      handleError(error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const filteredModules = useMemo(() => {
    const lowerSearch = permSearch.toLowerCase();
    return modules
      .map((mod) => ({
        module: mod,
        perms: permissions.filter((p) => p.module === mod && (!lowerSearch || p.codename.toLowerCase().includes(lowerSearch))),
      }))
      .filter((m) => m.perms.length > 0);
  }, [modules, permissions, permSearch]);

  const selectedCount = selectedPermissions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            {t('admin.pages.roles.title')}
          </h1>
          <p className="text-[var(--text-muted)]">{t('admin.pages.roles.subtitle')}</p>
        </div>
        <Button onClick={() => { setEditingRole(null); setRoleName(''); setRoleDescription(''); setSelectedPermissions([]); setPermSearch(''); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> {t('admin.pages.roles.newRole')}
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">{t('admin.pages.roles.loadError')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="h-full flex flex-col cursor-pointer hover:ring-1 hover:ring-[var(--primary)]" onClick={() => openEdit(role)}>
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">{role.name}</p>
                      {role.isSystem && <Badge variant="outline" className="text-xs">{t('admin.pages.roles.system')}</Badge>}
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)]">{role.description || t('admin.pages.roles.noDescription')}</p>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex items-center justify-between gap-4 text-sm text-[var(--text-tertiary)] mt-2">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {t('admin.pages.roles.users', { count: role.userCount })}</span>
                  <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> {t('admin.pages.roles.permissions', { count: role.permissionIds.length })}</span>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={(e) => { e.stopPropagation(); openDuplicate(role); }} title="Duplicate role">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={(o) => { setShowCreateDialog(o); if (!o) setEditingRole(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? t('admin.pages.roles.editTitle', { name: editingRole.name }) : t('admin.pages.roles.createTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.roles.editDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.roles.roleName')}</label>
                <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder={t('admin.pages.roles.roleNamePlaceholder')} disabled={editingRole?.isSystem} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.roles.description')}</label>
              <Textarea value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">{t('admin.pages.roles.permissions')} ({selectedCount})</label>
              </div>
              <div className="relative mb-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <Input
                  placeholder="Search permissions..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredModules.map(({ module: mod, perms }) => (
                <div key={mod} className="mb-4">
                  <h4 className="text-sm font-medium capitalize text-[var(--text-secondary)] mb-2">{mod}</h4>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((perm) => {
                      const isSelected = selectedPermissions.includes(perm.id);
                      return (
                        <button
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-[var(--primary)] text-[var(--text-primary)]'
                              : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {perm.codename}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {permSearch && filteredModules.length === 0 && (
                <p className="text-sm text-center py-4 text-[var(--text-tertiary)]">No permissions match &quot;{permSearch}&quot;</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div>
              {editingRole && !editingRole.isSystem && (
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> {t('admin.pages.roles.deleteButton')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingRole(null); }}>{t('admin.pages.roles.cancel')}</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {t('admin.pages.roles.save')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.pages.roles.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('admin.pages.roles.deleteDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>{t('admin.pages.roles.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> {t('admin.pages.roles.deleteButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
