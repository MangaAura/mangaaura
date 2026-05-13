'use client';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Base loading skeleton component
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-[var(--surface-elevated)] rounded", className)} />
  );
}

// Shimmer effect wrapper component
function Shimmer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// ============================================
// Manga Card Skeletons
// ============================================

interface MangaCardSkeletonProps {
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function MangaCardSkeleton({ variant = 'default', className }: MangaCardSkeletonProps) {
  const variants = {
    default: "aspect-[2/3]",
    compact: "aspect-[3/4] h-48",
    featured: "aspect-[16/9]",
  };

  return (
    <Shimmer className={cn("w-full rounded-lg", className)}>
      <div className={cn("bg-[var(--surface-elevated)] rounded-lg", variants[variant])} />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-[var(--surface-elevated)] rounded w-3/4" />
        <div className="h-3 bg-[var(--surface-elevated)] rounded w-1/2" />
      </div>
    </Shimmer>
  );
}

// Grid of manga card skeletons
interface MangaCardGridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

export function MangaCardGridSkeleton({ 
  count = 6, 
  columns = 6,
  className 
}: MangaCardGridSkeletonProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns as keyof typeof gridCols] || gridCols[6], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}

// ============================================
// Reader Skeletons
// ============================================

export function ReaderSkeleton({ className }: { className?: string }) {
  return (
    <Shimmer className={cn("w-full h-full flex flex-col", className)}>
      {/* Reader header */}
      <div className="h-14 bg-[var(--surface-elevated)] border-b border-[var(--border)] flex items-center px-4 gap-4">
        <div className="w-8 h-8 bg-[var(--surface-sunken)] rounded" />
        <div className="flex-1 h-4 bg-[var(--surface-sunken)] rounded w-1/3" />
        <div className="w-8 h-8 bg-[var(--surface-sunken)] rounded" />
      </div>
      
      {/* Page content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl aspect-[2/3] bg-[var(--surface-elevated)] rounded-lg" />
      </div>
      
      {/* Reader footer */}
      <div className="h-12 bg-[var(--surface-elevated)] border-t border-[var(--border)] flex items-center justify-center px-4 gap-4">
        <div className="w-24 h-8 bg-[var(--surface-sunken)] rounded" />
        <div className="flex-1 max-w-md h-2 bg-[var(--surface-sunken)] rounded-full" />
        <div className="w-24 h-8 bg-[var(--surface-sunken)] rounded" />
      </div>
    </Shimmer>
  );
}

// Reader sidebar skeleton
export function ReaderSidebarSkeleton({ className }: { className?: string }) {
  return (
    <Shimmer className={cn("w-80 h-full flex flex-col", className)}>
      <div className="p-4 border-b border-[var(--border)]">
        <div className="h-6 bg-[var(--surface-elevated)] rounded w-3/4 mb-2" />
        <div className="h-4 bg-[var(--surface-elevated)] rounded w-1/2" />
      </div>
      <div className="flex-1 p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-10 bg-[var(--surface-elevated)] rounded" />
        ))}
      </div>
    </Shimmer>
  );
}

// ============================================
// Chapter List Skeleton
// ============================================

interface ChapterListSkeletonProps {
  count?: number;
  className?: string;
}

export function ChapterListSkeleton({ count = 10, className }: ChapterListSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={`skeleton-${i}`} className="w-full">
          <div className="h-12 bg-[var(--surface-elevated)] rounded-lg flex items-center px-4 gap-4">
            <div className="w-8 h-8 bg-[var(--surface-sunken)] rounded" />
            <div className="flex-1">
              <div className="h-4 bg-[var(--surface-sunken)] rounded w-1/3 mb-1" />
              <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/4" />
            </div>
            <div className="w-16 h-6 bg-[var(--surface-sunken)] rounded" />
          </div>
        </Shimmer>
      ))}
    </div>
  );
}

// ============================================
// Comment Skeletons
// ============================================

export function CommentSkeleton({ className }: { className?: string }) {
  return (
    <Shimmer className={cn("flex gap-3 p-3", className)}>
      <div className="w-10 h-10 rounded-full bg-[var(--surface-elevated)] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
          <div className="h-3 w-16 bg-[var(--surface-elevated)] rounded" />
        </div>
        <div className="h-3 w-full bg-[var(--surface-elevated)] rounded" />
        <div className="h-3 w-2/3 bg-[var(--surface-elevated)] rounded" />
        <div className="flex gap-4 pt-1">
          <div className="h-6 w-12 bg-[var(--surface-elevated)] rounded" />
          <div className="h-6 w-12 bg-[var(--surface-elevated)] rounded" />
          <div className="h-6 w-12 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>
    </Shimmer>
  );
}

export function CommentListSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CommentSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
}

// ============================================
// User Profile Skeleton
// ============================================

export function UserProfileSkeleton({ className }: { className?: string }) {
  return (
    <Shimmer className={cn("space-y-6", className)}>
      {/* Cover */}
      <div className="h-32 bg-[var(--surface-elevated)] rounded-lg" />
      
      {/* Avatar and info */}
      <div className="flex items-center gap-4 px-4">
        <div className="w-20 h-20 rounded-full bg-[var(--surface-elevated)] -mt-10 border-4 border-[var(--surface)]" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-48 bg-[var(--surface-elevated)] rounded" />
          <div className="h-4 w-32 bg-[var(--surface-elevated)] rounded" />
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-24 bg-[var(--surface-elevated)] rounded-lg" />
        ))}
      </div>
      
      {/* Content */}
      <div className="px-4 space-y-3">
        <div className="h-4 bg-[var(--surface-elevated)] rounded w-full" />
        <div className="h-4 bg-[var(--surface-elevated)] rounded w-5/6" />
        <div className="h-4 bg-[var(--surface-elevated)] rounded w-4/6" />
      </div>
    </Shimmer>
  );
}

// ============================================
// Dashboard Skeletons
// ============================================

export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <Shimmer className={cn("space-y-6", className)}>
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-24 bg-[var(--surface-elevated)] rounded-lg" />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-64 bg-[var(--surface-elevated)] rounded-lg" />
      </div>
      
      {/* Table */}
      <div className="space-y-3">
        <div className="h-10 bg-[var(--surface-elevated)] rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-12 bg-[var(--surface-elevated)] rounded" />
        ))}
      </div>
    </Shimmer>
  );
}

// ============================================
// Leaderboard Skeleton
// ============================================

export function LeaderboardSkeleton({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={`skeleton-${i}`} className="w-full">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--surface-elevated)] h-16">
            <div className="w-8 h-8 bg-[var(--surface-sunken)] rounded-full" />
            <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)]" />
            <div className="flex-1">
              <div className="h-4 bg-[var(--surface-sunken)] rounded w-1/3 mb-1" />
              <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/4" />
            </div>
            <div className="w-16 h-6 bg-[var(--surface-sunken)] rounded" />
          </div>
        </Shimmer>
      ))}
    </div>
  );
}

// ============================================
// Search Results Skeleton
// ============================================

export function SearchResultsSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="h-12 bg-[var(--surface-elevated)] rounded-lg" />
      
      {/* Filter tags */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-8 w-20 bg-[var(--surface-elevated)] rounded-full" />
        ))}
      </div>
      
      {/* Results grid */}
      <MangaCardGridSkeleton count={count} columns={4} />
    </div>
  );
}

// ============================================
// Notification Skeleton
// ============================================

export function NotificationSkeleton({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={`skeleton-${i}`} className="w-full">
          <div className="flex gap-3 p-3 rounded-lg bg-[var(--surface-elevated)]">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-sunken)] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--surface-sunken)] rounded w-3/4" />
              <div className="h-3 bg-[var(--surface-sunken)] rounded w-1/2" />
            </div>
            <div className="w-16 h-6 bg-[var(--surface-sunken)] rounded" />
          </div>
        </Shimmer>
      ))}
    </div>
  );
}

// ============================================
// General Loading States
// ============================================

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-4", className)}>
      <div className="h-8 bg-[var(--surface-elevated)] rounded w-1/4" />
      <div className="h-96 bg-[var(--surface-elevated)] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-48 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-48 bg-[var(--surface-elevated)] rounded-lg" />
        <div className="h-48 bg-[var(--surface-elevated)] rounded-lg" />
      </div>
    </div>
  );
}

// Export namespace object (similar to existing Skeletons.tsx)
export const LoadingSkeletons = {
  MangaCard: MangaCardSkeleton,
  MangaCardGrid: MangaCardGridSkeleton,
  Reader: ReaderSkeleton,
  ReaderSidebar: ReaderSidebarSkeleton,
  ChapterList: ChapterListSkeleton,
  Comment: CommentSkeleton,
  CommentList: CommentListSkeleton,
  UserProfile: UserProfileSkeleton,
  Dashboard: DashboardSkeleton,
  Leaderboard: LeaderboardSkeleton,
  SearchResults: SearchResultsSkeleton,
  Notification: NotificationSkeleton,
  Page: PageSkeleton,
};

export default LoadingSkeletons;
