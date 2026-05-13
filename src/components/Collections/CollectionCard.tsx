'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { Lock, Globe, MoreVertical, Edit, Trash2, Share2 } from 'lucide-react';

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    _count: { mangas: number };
    user: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
    previewMangas: Array<{
      id: string;
      title: string;
      cover: string | null;
    }>;
  };
  currentUserId?: string;
  onDelete?: (id: string) => void;
}

export function CollectionCard({
  collection,
  currentUserId,
  onDelete,
}: CollectionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId === collection.user.id;

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta colección?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(collection.id);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/collections/${collection.id}`;
    if (navigator.share) {
      await navigator.share({
        title: collection.name,
        text: collection.description || undefined,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copiado al portapapeles');
    }
  };

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-[var(--primary)]/10 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md',
        isDeleting && 'opacity-50'
      )}
    >
      {/* Preview Grid */}
      <Link href={`/collections/${collection.id}`} className="block">
        <div className="aspect-[16/9] bg-[var(--surface-sunken)] relative overflow-hidden">
          {collection.previewMangas.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5 h-full">
              {collection.previewMangas.slice(0, 3).map((manga, i) => (
                <div key={manga.id} className="relative overflow-hidden">
                  {manga.cover ? (
                    <img
                      src={manga.cover}
                      alt={manga.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface-sunken)] flex items-center justify-center">
                      <span className="text-xs text-[var(--text-tertiary)]">{manga.title[0]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--surface-sunken)]">
              <span className="text-[var(--text-tertiary)] text-sm">Sin mangas</span>
            </div>
          )}

          {/* Privacy Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant={collection.isPublic ? 'default' : 'secondary'}>
              {collection.isPublic ? (
                <Globe className="w-3 h-3 mr-1" />
              ) : (
                <Lock className="w-3 h-3 mr-1" />
              )}
              {collection.isPublic ? 'Pública' : 'Privada'}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={`/collections/${collection.id}`}>
              <h3 className="font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--primary)] transition-colors">
                {collection.name}
              </h3>
            </Link>
            <p className="text-sm text-[var(--text-tertiary)] mt-1 line-clamp-2">
              {collection.description || 'Sin descripción'}
            </p>
          </div>

          {/* Actions */}
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2" aria-label="Más opciones">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/collections/${collection.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-[var(--error)]"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
          <Link href={`/user/${collection.user.username}`} className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={collection.user.avatarUrl || undefined} />
              <AvatarFallback className="bg-[var(--surface-sunken)] text-xs">
                {collection.user.displayName?.[0] || collection.user.username[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-[var(--text-secondary)]">
              {collection.user.displayName || collection.user.username}
            </span>
          </Link>
          <span className="text-sm text-[var(--text-tertiary)]">
            {collection._count.mangas} {collection._count.mangas === 1 ? 'manga' : 'mangas'}
          </span>
        </div>
      </div>
    </Card>
  );
}
