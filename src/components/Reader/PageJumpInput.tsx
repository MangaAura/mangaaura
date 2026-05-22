'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { cn } from '@/lib/utils';

interface PageJumpInputProps {
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
}

export function PageJumpInput({ currentPage, totalPages, onJump }: PageJumpInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(currentPage));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(currentPage));
    }
  }, [currentPage, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = useCallback(() => {
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onJump(page);
    }
    setIsEditing(false);
  }, [inputValue, totalPages, onJump]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setInputValue(String(currentPage));
        setIsEditing(false);
      }
    },
    [handleSubmit, currentPage]
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.replace(/\D/g, ''))}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-12 text-center text-sm py-1 rounded-md border',
            'bg-[var(--surface)] border-[var(--border)]',
            'text-[var(--text-primary)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
          )}
          aria-label="Ir a página"
        />
        <span className="text-[var(--text-tertiary)] text-sm">/ {totalPages}</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'px-2 py-1 rounded-md text-sm transition-colors cursor-pointer',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        'hover:bg-[var(--text-inverse)]/10 min-w-[4rem] text-center'
      )}
      title="Click para ir a una página específica"
      aria-label={`Página ${currentPage} de ${totalPages}. Click para saltar.`}
    >
      {currentPage} / {totalPages}
    </button>
  );
}
