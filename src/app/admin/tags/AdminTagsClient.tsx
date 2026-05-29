'use client';

import {
  Edit3,
  Hash,
  Plus,
  Save,
  Tag,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { TagSelector } from '@/components/tags/TagSelector';
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
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useTags, type Tag as TagType } from '@/hooks/useTags';

export default function AdminTagsClient() {
  const {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  } = useTags();

  const [activeTab, setActiveTab] = useState<'list' | 'tree' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [newParentId, setNewParentId] = useState<string>('');
  const [newType, setNewType] = useState('TAG');
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');
  const [editParentId, setEditParentId] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editType, setEditType] = useState('TAG');
  const [editError, setEditError] = useState<string | null>(null);

  const loadTags = useCallback(() => {
    fetchTags({ includeChildren: true });
  }, [fetchTags]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const filteredTags = tags.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const tagTypes = [...new Set(tags.map((t) => t.type))];

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    setCreateError(null);

    const result = await createTag({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      color: newColor || undefined,
      parentId: newParentId || undefined,
      type: newType,
    });

    setIsSaving(false);

    if (result) {
      setNewName('');
      setNewDescription('');
      setNewColor('#6366f1');
      setNewParentId('');
      setNewType('TAG');
      setActiveTab('list');
    } else {
      setCreateError('Error al crear el tag');
    }
  };

  const openEditDialog = (tag: TagType) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditDescription(tag.description || '');
    setEditColor(tag.color || '#6366f1');
    setEditParentId(tag.parentId || '');
    setEditIsActive(tag.isActive);
    setEditType(tag.type);
    setEditError(null);
  };

  const handleEdit = async () => {
    if (!editingTag) return;
    if (!editName.trim()) {
      setEditError('El nombre es requerido');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    const result = await updateTag(editingTag.id, {
      name: editName.trim(),
      description: editDescription.trim() || '',
      color: editColor,
      parentId: editParentId || null,
      isActive: editIsActive,
      type: editType,
    });

    setIsSaving(false);

    if (result) {
      setEditingTag(null);
      loadTags();
    } else {
      setEditError('Error al actualizar el tag');
    }
  };

  const confirmDelete = async () => {
    if (!deletingTag) return;

    setIsDeleting(true);
    const success = await deleteTag(deletingTag.id);
    setIsDeleting(false);

    if (success) {
      setDeletingTag(null);
      loadTags();
    }
  };

  // Available parent tags (exclude self and children)
  const availableParents = editingTag
    ? tags.filter((t) => {
        if (t.id === editingTag.id) return false;
        // Also exclude children to prevent circular references
        const isChild = (parentId: string | null): boolean => {
          if (!parentId) return false;
          if (parentId === editingTag.id) return true;
          const parent = tags.find((p) => p.id === parentId);
          return parent ? isChild(parent.parentId) : false;
        };
        return !isChild(t.parentId);
      })
    : tags;

  const renderTagsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Tag
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden md:table-cell">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider hidden lg:table-cell">
              Padre
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {filteredTags.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-[var(--text-tertiary)]">
                <Hash className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No se encontraron tags</p>
              </td>
            </tr>
          ) : (
            filteredTags.map((tag) => {
              const parentName = tag.parentId
                ? tags.find((t) => t.id === tag.parentId)?.name
                : null;
              return (
                <tr
                  key={tag.id}
                  className="hover:bg-[var(--surface-sunken)]/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color || 'var(--text-tertiary)' }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--text-primary)] text-sm truncate max-w-[180px]">
                          {tag.name}
                        </p>
                        {tag.description && (
                          <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[180px]">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {tag.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-[var(--text-tertiary)]">
                      {parentName || (
                        <span className="italic text-[var(--text-tertiary)]/60">—</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        tag.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'
                      }`}
                      title={tag.isActive ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(tag)}
                        title="Editar tag"
                        aria-label={`Editar ${tag.name}`}
                      >
                        <Edit3 className="w-4 h-4 text-[var(--primary)]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingTag(tag)}
                        title="Eliminar tag"
                        aria-label={`Eliminar ${tag.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-[var(--error)]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Tag className="w-6 h-6 text-[var(--primary)]" />
            Gestión de Tags
          </h1>
          <p className="text-[var(--text-muted)]">
            Administra los tags, categorías y etiquetas del sistema
          </p>
        </div>
        <Button onClick={() => setActiveTab('create')}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo tag
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface-sunken)] p-1 rounded-xl w-fit" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'list'}
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
            ${activeTab === 'list'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
        >
          Lista
          <span className="ml-1.5 text-xs opacity-60">({tags.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'tree'}
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
            ${activeTab === 'tree'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
        >
          Árbol jerárquico
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'create'}
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
            ${activeTab === 'create'
              ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
            }`}
        >
          + Crear
        </button>
      </div>

      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--primary)]" />
              Crear nuevo tag
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {createError && <ErrorMessage message={createError} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Nombre <span className="text-[var(--error)]">*</span>
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Acción, Romance, Shonen..."
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Tipo
                </label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TAG">Tag</SelectItem>
                    <SelectItem value="CATEGORY">Categoría</SelectItem>
                    <SelectItem value="GENRE">Género</SelectItem>
                    <SelectItem value="THEME">Tema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Descripción
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción del tag (opcional)"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-[var(--border)]"
                  />
                  <span className="text-xs text-[var(--text-tertiary)] font-mono">
                    {newColor}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Tag padre (opcional)
                </label>
                <Select value={newParentId} onValueChange={(v) => setNewParentId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguno (tag raíz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno (tag raíz)</SelectItem>
                    {tags
                      .filter((t) => t.id !== newParentId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab('list');
                  setCreateError(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} isLoading={isSaving}>
                <Plus className="w-4 h-4 mr-2" />
                Crear tag
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'list' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-[var(--primary)]" />
              Todos los tags
              <span className="text-sm font-normal text-[var(--text-tertiary)]">
                ({filteredTags.length} de {tags.length})
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Input
                  placeholder="Buscar tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-sm pl-8"
                />
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </div>
              {tagTypes.length > 0 && (
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {tagTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="animate-pulse space-y-3 p-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-[var(--surface-sunken)] rounded" />
                ))}
              </div>
            ) : error ? (
              <div className="p-6">
                <ErrorMessage message={error} action={{ label: 'Reintentar', onClick: loadTags }} />
              </div>
            ) : (
              renderTagsTable()
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tree' && (
        <TagSelector
          title="Árbol de tags"
          showCreateForm
          maxHeight="600px"
          className=""
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => { if (!open) setEditingTag(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[var(--primary)]" />
              Editar tag
            </DialogTitle>
            <DialogDescription>
              Modifica las propiedades del tag &quot;{editingTag?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          {editError && <ErrorMessage message={editError} />}

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Nombre <span className="text-[var(--error)]">*</span>
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Tipo
                </label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TAG">Tag</SelectItem>
                    <SelectItem value="CATEGORY">Categoría</SelectItem>
                    <SelectItem value="GENRE">Género</SelectItem>
                    <SelectItem value="THEME">Tema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Descripción
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border border-[var(--border)]"
                  />
                  <span className="text-xs text-[var(--text-tertiary)] font-mono">
                    {editColor}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Tag padre
                </label>
                <Select
                  value={editParentId || 'none'}
                  onValueChange={(v) => setEditParentId(v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno (tag raíz)</SelectItem>
                    {availableParents.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="text-sm font-medium text-[var(--text-secondary)] cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Tag activo
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} isLoading={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingTag} onOpenChange={(open) => { if (!open) setDeletingTag(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--error)]">
              <Trash2 className="w-5 h-5" />
              Eliminar tag
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el tag &quot;{deletingTag?.name}&quot;?
              {deletingTag && tags.filter((t) => t.parentId === deletingTag.id).length > 0 && (
                <span className="block mt-2 text-[var(--warning)]">
                  ⚠️ Este tag tiene {tags.filter((t) => t.parentId === deletingTag.id).length} tag(s) hijo(s) que se quedarán sin padre.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {deletingTag && (
            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg my-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: deletingTag.color || 'var(--text-tertiary)' }}
                />
                <span className="font-medium text-sm">{deletingTag.name}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {deletingTag.type}
                </Badge>
              </div>
              {deletingTag.description && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1 ml-5">
                  {deletingTag.description}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingTag(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} isLoading={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
