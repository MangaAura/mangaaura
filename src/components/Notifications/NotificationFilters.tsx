/**
 * NotificationFilters Component
 * 
 * Panel de filtros para notificaciones.
 */

import { cn } from '@/lib/utils';

type FilterType = 'all' | 'chapters' | 'comments' | 'likes' | 'mentions' | 'follows';
type FilterStatus = 'all' | 'unread' | 'read';

interface NotificationFiltersProps {
  filterType: FilterType;
  filterStatus: FilterStatus;
  onTypeChange: (type: FilterType) => void;
  onStatusChange: (status: FilterStatus) => void;
}

const typeOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'chapters', label: 'Capítulos' },
  { value: 'comments', label: 'Comentarios' },
  { value: 'likes', label: 'Likes' },
  { value: 'mentions', label: 'Menciones' },
  { value: 'follows', label: 'Seguidores' },
];

const statusOptions = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'No leídas' },
  { value: 'read', label: 'Leídas' },
];

export function NotificationFilters({
  filterType,
  filterStatus,
  onTypeChange,
  onStatusChange,
}: NotificationFiltersProps) {
  return (
    <div className="bg-[var(--surface-sunken)] rounded-xl p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-[var(--text-tertiary)] self-center mr-2">Tipo:</span>
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTypeChange(option.value as FilterType)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                filterType === option.value
                ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-elevated)]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-[var(--text-tertiary)] self-center mr-2">Estado:</span>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value as FilterStatus)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
                filterStatus === option.value
                ? 'bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-elevated)]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NotificationFilters;
