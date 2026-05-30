/**
 * TagSelector Component
 *
 * Hierarchical tag browser/selector with support for parent-child relationships,
 * color coding, and multi-select.
 */

'use client';

import {
  ChevronDown,
  ChevronRight,
  Hash,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';


import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { SectionTitle } from '@/components/ui/SectionTitle';
import type { Tag as TagType } from '@/hooks/useTags';
import { useTags } from '@/hooks/useTags';

interface TagSelectorProps {
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  type?: string;
  title?: string;
  className?: string;
  multiSelect?: boolean;
  showCreateForm?: boolean;
  maxHeight?: string;
}

function TagBadge({
  tag,
  isSelected,
  onClick,
}: {
  tag: TagType;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-md shadow-[var(--primary)]/20 scale-105'
          : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] border border-[var(--border)]'
        }
      `}
      style={tag.color && !isSelected ? { borderColor: tag.color, color: tag.color } : undefined}
    >
      {isSelected ? (
        <X className="w-3 h-3" />
      ) : (
        <Hash className="w-3 h-3" />
      )}
      <span>{tag.name}</span>
    </button>
  );
}

function TagTreeNode({
  tag,
  selectedTagIds,
  onToggle,
  depth = 0,
}: {
  tag: TagType;
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedTagIds.includes(tag.id);
  const hasChildren = tag.children && tag.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer
          ${isSelected ? 'bg-[var(--primary)]/10' : 'hover:bg-[var(--surface-sunken)]'}
        `}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <button
          onClick={() => onToggle(tag.id)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: tag.color || 'var(--text-tertiary)' }}
          />
          <span className={`text-sm truncate ${isSelected ? 'font-medium text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
            {tag.name}
          </span>
          {tag.description && (
            <span className="text-xs text-[var(--text-tertiary)] truncate hidden sm:inline">
              — {tag.description}
            </span>
          )}
          {isSelected && (
            <Badge variant="default" className="ml-auto text-[10px] px-1.5 py-0">
              Seleccionado
            </Badge>
          )}
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="ml-2">
          {tag.children!.map((child) => (
            <TagTreeNode
              key={child.id}
              tag={child}
              selectedTagIds={selectedTagIds}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTagForm({ onClose, onTagCreated }: { onClose: () => void; onTagCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      onTagCreated();
      onClose();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || 'Error al crear el tag');
    }
  };

  return (
    <div className="p-4 bg-[var(--surface-sunken)] rounded-xl border border-[var(--border)] space-y-3">
      {error && <ErrorMessage message={error} />}

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del tag"
        maxLength={50}
      />

      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        maxLength={200}
      />

      <div className="flex items-center gap-2">
        <label className="text-xs text-[var(--text-secondary)]">Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-[var(--border)]"
        />
        <span className="text-xs text-[var(--text-tertiary)] font-mono">{color}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Crear tag
        </Button>
      </div>
    </div>
  );
}

export function TagSelector({
  selectedTagIds = [],
  onTagsChange,
  type,
  title = 'Tags',
  className = '',
  multiSelect = true,
  showCreateForm = false,
  maxHeight,
}: TagSelectorProps) {
  const { data: session } = useSession();
  const { tags, isLoading, error, fetchTags } = useTags();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  const loadTags = useCallback(() => {
    fetchTags({ type, includeChildren: true });
  }, [fetchTags, type]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleToggle = (tagId: string) => {
    if (!onTagsChange) return;

    if (multiSelect) {
      const newSelected = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId];
      onTagsChange(newSelected);
    } else {
      onTagsChange([tagId]);
    }
  };

  const filteredTags = filter
    ? tags.filter(
        (t) =>
          t.name.toLowerCase().includes(filter.toLowerCase()) ||
          t.description?.toLowerCase().includes(filter.toLowerCase())
      )
    : tags;

  const rootTags = filteredTags.filter((t) => !t.parentId);

  return (
    <section className={className}>
      <SectionTitle icon={<Tag className="w-5 h-5" />}>
        {title}
        {selectedTagIds.length > 0 && (
          <Badge variant="secondary" className="ml-2 text-[10px]">
            {selectedTagIds.length}
          </Badge>
        )}
      </SectionTitle>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search filter */}
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar tags..."
            className="text-sm"
          />

          {/* Flat tags display for simple selection */}
          {tags.length > 0 && filteredTags.length <= 20 && (
            <div className="flex flex-wrap gap-1.5">
              {filteredTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  isSelected={selectedTagIds.includes(tag.id)}
                  onClick={() => handleToggle(tag.id)}
                />
              ))}
            </div>
          )}

          {/* Hierarchical tree view for larger tag sets or when filtered */}
          {(filteredTags.length > 20 || !filter) && (
            <div
              className="space-y-0.5 overflow-y-auto"
              style={maxHeight ? { maxHeight } : undefined}
            >
              {rootTags.length === 0 && !isLoading ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                  No hay tags disponibles
                </p>
              ) : (
                rootTags.map((tag) => (
                  <TagTreeNode
                    key={tag.id}
                    tag={tag}
                    selectedTagIds={selectedTagIds}
                    onToggle={handleToggle}
                  />
                ))
              )}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-7 w-20 bg-[var(--surface-sunken)] rounded-full animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <ErrorMessage
              message={error}
              action={{ label: 'Reintentar', onClick: loadTags }}
            />
          )}

          {session?.user && showCreateForm && !showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nuevo tag
            </Button>
          )}

          {showForm && <CreateTagForm onClose={() => setShowForm(false)} onTagCreated={loadTags} />}
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * MangaTagSelector - Simplified version for manga detail pages
 */
interface MangaTagSelectorProps {
  mangaId: string;
  initialTags?: string[];
  readOnly?: boolean;
}

export function MangaTagSelector({
  mangaId,
  initialTags = [],
  readOnly = false,
}: MangaTagSelectorProps) {
  const [assignedTags, setAssignedTags] = useState<string[]>(initialTags);
  const { tags, isLoading, fetchTags } = useTags();

  useEffect(() => {
    fetchTags({ includeChildren: false });
  }, [fetchTags]);

  const handleToggle = async (tagId: string) => {
    if (readOnly) return;

    const isCurrentlyAssigned = assignedTags.includes(tagId);
    const newTags = isCurrentlyAssigned
      ? assignedTags.filter((id) => id !== tagId)
      : [...assignedTags, tagId];

    // Optimistic update
    setAssignedTags(newTags);

    try {
      const method = isCurrentlyAssigned ? 'DELETE' : 'POST';
      const res = await fetch(`/api/mangas/${mangaId}/tags/${tagId}`, { method });

      if (!res.ok) {
        setAssignedTags(assignedTags);
      }
    } catch {
      setAssignedTags(assignedTags);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {isLoading ? (
        <div className="flex gap-1.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 w-16 bg-[var(--surface-sunken)] rounded-full animate-pulse" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">Sin tags</p>
      ) : (
        tags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            isSelected={assignedTags.includes(tag.id)}
            onClick={() => handleToggle(tag.id)}
          />
        ))
      )}
    </div>
  );
}
