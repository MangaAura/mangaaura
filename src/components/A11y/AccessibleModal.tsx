'use client';

import { useEffect, useRef, ReactNode, useCallback } from 'react';
import FocusLock from 'react-focus-lock';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  footer?: ReactNode;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  footer,
}: AccessibleModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`).current;
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`).current;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    },
    [closeOnEscape, isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown);
      
      // Return focus to trigger element on close
      const triggerElement = document.activeElement as HTMLElement;
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
        triggerElement?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
    >
      <FocusLock returnFocus>
        <div
          className={cn(
            'w-full bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border)]',
            'max-h-[90vh] overflow-y-auto',
            sizes[size],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-[var(--border)]">
            <div className="flex-1 pr-4">
              <h2
                id={titleId}
                className="text-xl font-semibold text-[var(--text-primary)]"
              >
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-[var(--text-secondary)]">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]"
                aria-label="Cerrar diálogo"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
              {footer}
            </div>
          )}
        </div>
      </FocusLock>
    </div>
  );
}

// Accessible Alert Dialog
interface AccessibleAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function AccessibleAlert({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: AccessibleAlertProps) {
  const variants = {
    danger: {
      button: 'bg-[var(--error)] hover:opacity-90',
      icon: '⚠️',
    },
    warning: {
      button: 'bg-[var(--warning)] hover:opacity-90',
      icon: '⚡',
    },
    info: {
      button: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]',
      icon: 'ℹ️',
    },
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnOverlayClick={false}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={variants[variant].button}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl" role="img" aria-label="Alerta">
          {variants[variant].icon}
        </span>
        <p className="text-[var(--text-secondary)]">{description}</p>
      </div>
    </AccessibleModal>
  );
}
