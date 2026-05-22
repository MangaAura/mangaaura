'use client';

import { X, MessageSquare, ChevronLeft } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';

import CommentSection from '@/components/Comments/CommentSection';
import { cn } from '@/lib/utils';

export interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  mangaId: string;
  commentCount?: number;
}

export function CommentDrawer({
  isOpen,
  onClose,
  chapterId,
  mangaId,
  commentCount = 0,
}: CommentDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else if (previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Handle click outside on desktop
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isMobile && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Touch handling for mobile swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !isMobile) return;

    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY.current;

    // Only handle downward swipes
    if (diff > 50 && drawerRef.current) {
      drawerRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !isMobile || !drawerRef.current) return;

    const touchY = e.changedTouches[0].clientY;
    const diff = touchY - touchStartY.current;

    // Close if swiped down more than 100px
    if (diff > 100) {
      onClose();
    } else {
      // Reset position
      drawerRef.current.style.transform = '';
    }

    touchStartY.current = null;
  };

  if (!isOpen) return null;

  return (
    <FocusLock returnFocus>
    <>
      {/* Backdrop */}
      <button
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 cursor-pointer',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-label="Cerrar comentarios"
        type="button"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comment-drawer-title"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'fixed z-50 bg-background shadow-2xl transition-transform duration-300 ease-out',
          // Mobile: Bottom sheet
          'max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-[85vh] max-md:rounded-t-2xl max-md:transform max-md:translate-y-0',
          // Desktop: Right sidebar
          'md:right-0 md:top-0 md:bottom-0 md:w-[450px] md:left-auto md:h-full md:transform md:translate-x-0'
        )}
      >
        {/* Drag Handle (Mobile Only) */}
        <div className="md:hidden flex justify-center pt-3 pb-2" aria-hidden="true">
          <div className="w-12 h-1.5 bg-[var(--surface-sunken)] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--info)]" aria-hidden="true" />
            <h2 id="comment-drawer-title" className="text-lg font-semibold">
              Comentarios
              {commentCount > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({commentCount})
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile back button */}
        <button
          onClick={onClose}
          className="md:hidden flex items-center gap-1 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
              <ChevronLeft size={16} aria-hidden="true" />
              Volver
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-sunken)] rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar comentarios"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-60px)] overflow-hidden">
          <div className="h-full overflow-y-auto">
            <CommentSection
              chapterId={chapterId}
              mangaId={mangaId}
              className="bg-transparent rounded-none"
            />
          </div>
        </div>
      </div>
    </>
    </FocusLock>
  );
}

export default CommentDrawer;
