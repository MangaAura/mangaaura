'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Shield, Plus, Save, Trash2, Loader2, Users, Check } from 'lucide-react';

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
import { useErrorHandler } from '@/hooks/useErrorHandler';
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

export default function RolesPage() {
  const { handleError } = useErrorHandler();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

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
    setShowCreateDialog(true);
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
        }
      } else {
        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roleName, description: roleDescription }),
        });
        if (response.ok) {
          await mutate();
          setShowCreateDialog(false);
        }
      }
    } catch (error) {
      handleError(error);
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
      }
    } catch (error) {
      handleError(error);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const permissionsByModule = modules.map((mod) => ({
    module: mod,
    perms: permissions.filter((p) => p.module === mod),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--primary)]" />
            Role Management (RBAC)
          </h1>
          <p className="text-[var(--text-muted)]">Create and manage roles with granular permissions</p>
        </div>
        <Button onClick={() => { setEditingRole(null); setRoleName(''); setRoleDescription(''); setSelectedPermissions([]); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Role
        </Button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-[var(--surface-sunken)] rounded" />)}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-[var(--error)]">Failed to load roles</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="cursor-pointer hover:ring-1 hover:ring-[var(--primary)]" onClick={() => openEdit(role)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-lg">{role.name}</p>
                      {role.isSystem && <Badge variant="outline" className="text-xs">System</Badge>}
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)]">{role.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {role.userCount} users</span>
                  <span>Priority: {role.priority}</span>
                  <span>{role.permissionIds.length} permissions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={(o) => { setShowCreateDialog(o); if (!o) setEditingRole(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? `Edit Role: ${editingRole.name}` : 'Create Role'}</DialogTitle>
            <DialogDescription>Configure role name and granular permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)]">Role Name</label>
                <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Moderator" disabled={editingRole?.isSystem} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Description</label>
              <Textarea value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Permissions</label>
              {permissionsByModule.map(({ module: mod, perms }) => (
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
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div>
              {editingRole && !editingRole.isSystem && (
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Role
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingRole(null); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>This will remove the role from all assigned users. Users will keep their base permissions.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
