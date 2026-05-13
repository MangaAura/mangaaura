import { Card, CardContent, CardHeader } from '@/components/ui/Card';

// Namespace object for all skeletons
export const Skeletons = {
  MangaCard: MangaCardSkeleton,
  MangaDetail: MangaDetailSkeleton,
  UserProfile: UserProfileSkeleton,
  ChapterList: ChapterListSkeleton,
  Comment: CommentSkeleton,
  Leaderboard: LeaderboardSkeleton,
  CardGrid: CardGridSkeleton,
};

// Manga Card Skeleton
export function MangaCardSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="aspect-[2/3] bg-[var(--surface-elevated)] rounded-lg mb-2" />
      <div className="h-4 bg-[var(--surface-elevated)] rounded w-3/4 mb-1" />
      <div className="h-3 bg-[var(--surface-elevated)] rounded w-1/2" />
    </div>
  );
}

// Manga Detail Skeleton
export function MangaDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-6">
        <div className="w-48 h-72 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-[var(--surface-elevated)] rounded w-3/4" />
          <div className="h-4 bg-[var(--surface-elevated)] rounded w-1/2" />
          <div className="h-4 bg-[var(--surface-elevated)] rounded w-1/4" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-[var(--surface-elevated)] rounded" />
            <div className="h-8 w-24 bg-[var(--surface-elevated)] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// User Profile Skeleton
export function UserProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-[var(--surface-elevated)] rounded-lg" />
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-[var(--surface-elevated)]" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-24 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-24 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-24 bg-[var(--surface-elevated)] rounded-lg" />
      </div>
    </div>
  );
}

// Chapter List Skeleton
export function ChapterListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="h-12 bg-[var(--surface-elevated)] rounded-lg" />
      ))}
    </div>
  );
}

// Comment Skeleton
export function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
        <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
        <div className="h-3 w-2/3 bg-[var(--surface-elevated)] rounded" />
      </div>
    </div>
  );
}

// Leaderboard Skeleton
export function LeaderboardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-elevated)] h-14" />
      ))}
    </div>
  );
}

// Card Grid Skeleton
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}
