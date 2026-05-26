'use client';

import {
  Trophy,
  Medal,
  Crown,
  Flame,
  Eye,
  Star,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';


type LeaderboardType = 'readers' | 'creators' | 'clans' | 'manga';

interface LeaderboardTableProps {
  type: LeaderboardType;
  data: any[];
  currentUserId?: string;
}

const ITEMS_PER_PAGE = 25;

export function LeaderboardTable({ type, data, currentUserId }: LeaderboardTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-[var(--warning)]" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-[var(--text-secondary)]" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-[var(--accent-orange)]" />;
    return <span className="text-[var(--text-tertiary)] font-medium w-5 text-center">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-[var(--warning)]/10 border-[var(--warning)]/30';
    if (rank === 2) return 'bg-[var(--text-tertiary)]/10 border-[var(--text-tertiary)]/30';
    if (rank === 3) return 'bg-[var(--accent-orange)]/10 border-[var(--accent-orange)]/30';
    return '';
  };

  const renderReaderRow = (item: any, rank: number) => (
    <>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center">{getRankIcon(rank)}</div>
      </td>
      <td className="py-4 px-4">
        <Link
          href={`/user/${item.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={item.avatarUrl || undefined} />
            <AvatarFallback className="bg-[var(--surface-sunken)]">
              {item.displayName?.[0] || item.username[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
              {item.displayName || item.username}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">@{item.username}</p>
          </div>
        </Link>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Trophy className="w-4 h-4 text-[var(--warning)]" />
          <span className="font-semibold text-[var(--text-primary)]">{item.xpPoints.toLocaleString()}</span>
          <span className="text-xs text-[var(--text-secondary)]">XP</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">Nivel {item.level}</p>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Flame className="w-4 h-4 text-[var(--accent-orange)]" />
          <span className="font-medium text-[var(--text-primary)]">{item.readingStreak}</span>
          <span className="text-xs text-[var(--text-secondary)]">días</span>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-[var(--text-secondary)]">
          {item._count.readingProgress} capítulos
        </span>
      </td>
    </>
  );

  const renderCreatorRow = (item: any, rank: number) => (
    <>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center">{getRankIcon(rank)}</div>
      </td>
      <td className="py-4 px-4">
        <Link
          href={`/user/${item.username}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={item.avatarUrl || undefined} />
            <AvatarFallback className="bg-[var(--surface-sunken)]">
              {item.displayName?.[0] || item.username[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
              {item.displayName || item.username}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">@{item.username}</p>
          </div>
        </Link>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Eye className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-semibold text-[var(--text-primary)]">{item.totalViews.toLocaleString()}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">vistas totales</p>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <BookOpen className="w-4 h-4 text-[var(--success)]" />
          <span className="font-medium text-[var(--text-primary)]">{item._count.createdMangas}</span>
          <span className="text-xs text-[var(--text-secondary)]">mangas</span>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-[var(--text-secondary)]">
          {item.totalChapters} capítulos
        </span>
      </td>
    </>
  );

  const renderClanRow = (item: any, rank: number) => (
    <>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center">{getRankIcon(rank)}</div>
      </td>
      <td className="py-4 px-4">
        <Link
          href={`/community/clan/${item.slug}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center">
            <Users className="w-5 h-5 text-[var(--text-inverse)]" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
              {item.name}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Lider: {item.leader.displayName || item.leader.username}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Trophy className="w-4 h-4 text-[var(--warning)]" />
          <span className="font-semibold text-[var(--text-primary)]">{item.totalScore.toLocaleString()}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">puntos</p>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Users className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-medium text-[var(--text-primary)]">{item._count.members}</span>
          <span className="text-xs text-[var(--text-secondary)]">miembros</span>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-[var(--text-secondary)]">
          {item.rank === 'LEGEND' && (
            <Badge className="bg-[var(--warning)]/20 text-[var(--warning)]">Legendario</Badge>
          )}
          {item.rank === 'EPIC' && (
            <Badge className="bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]">Épico</Badge>
          )}
          {item.rank === 'RARE' && (
            <Badge className="bg-[var(--info)]/20 text-[var(--info)]">Raro</Badge>
          )}
          {!['LEGEND', 'EPIC', 'RARE'].includes(item.rank) && (
            <Badge className="bg-[var(--surface-sunken)]">Común</Badge>
          )}
        </span>
      </td>
    </>
  );

  const renderMangaRow = (item: any, rank: number) => (
    <>
      <td className="py-4 px-4">
        <div className="flex items-center justify-center">{getRankIcon(rank)}</div>
      </td>
      <td className="py-4 px-4">
        <Link
          href={`/manga/${item.slug}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-14 bg-[var(--surface-sunken)] rounded overflow-hidden flex-shrink-0">
            {item.coverUrl ? (
              <OptimizedImage
                src={item.coverUrl}
                alt={item.title}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">
                {item.title[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
              {item.title}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              por {item.author.displayName || item.author.username}
            </p>
          </div>
        </Link>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Eye className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-semibold text-[var(--text-primary)]">{item.totalViews.toLocaleString()}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)]">vistas</p>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Star className="w-4 h-4 text-[var(--warning)]" />
          <span className="font-medium text-[var(--text-primary)]">
            {item.rating?.toFixed(1) || '-'}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-[var(--text-secondary)]">
          {item._count.chapters} capítulos
        </span>
      </td>
    </>
  );

  const renderRow = (item: any, index: number) => {
    const rank = startIndex + index + 1;
    const isCurrentUser = currentUserId && item.id === currentUserId;

    return (
      <tr
        key={item.id}
        className={cn(
          'border-b border-[var(--border)] transition-colors',
          rank <= 3 && getRankStyle(rank),
          isCurrentUser && 'bg-[var(--primary)]/5',
          'hover:bg-[var(--surface-sunken)]/50'
        )}
      >
        {type === 'readers' && renderReaderRow(item, rank)}
        {type === 'creators' && renderCreatorRow(item, rank)}
        {type === 'clans' && renderClanRow(item, rank)}
        {type === 'manga' && renderMangaRow(item, rank)}
      </tr>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]/50">
              <th className="py-3 px-4 text-left font-medium text-[var(--text-secondary)] w-16">#</th>
              <th className="py-3 px-4 text-left font-medium text-[var(--text-secondary)]">
                {type === 'manga' ? 'Título' : 'Nombre'}
              </th>
              <th className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                {type === 'readers' ? 'XP' : type === 'clans' ? 'Puntos' : 'Vistas'}
              </th>
              <th className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                {type === 'readers' ? 'Racha' : type === 'manga' ? 'Rating' : 'Contenido'}
              </th>
              <th className="py-3 px-4 text-right font-medium text-[var(--text-secondary)]">
                Detalles
              </th>
            </tr>
          </thead>
          <tbody>{paginatedData.map((item, index) => renderRow(item, index))}</tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-secondary)]">
            Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, data.length)} de{' '}
            {data.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 py-2 text-sm text-[var(--text-secondary)]">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
