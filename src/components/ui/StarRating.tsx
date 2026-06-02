'use client';

import { useState, useCallback, useId } from 'react';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Current rating value (0-5). Can be decimal for display mode. */
  value: number;
  /** Total number of ratings (displayed in display mode) */
  totalRatings?: number;
  /** Whether the user can interact with the stars */
  interactive?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Called when user clicks a star */
  onChange?: (rating: number) => void;
  /** User's current rating (to highlight selected stars differently) */
  userRating?: number;
  /** Show average display instead of user rating */
  showAverage?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { star: 'w-4 h-4', gap: 'gap-0.5', text: 'text-xs' },
  md: { star: 'w-5 h-5', gap: 'gap-1', text: 'text-sm' },
  lg: { star: 'w-7 h-7', gap: 'gap-1', text: 'text-base' },
};

function StarIcon({
  filled,
  half,
  className,
  size,
  gradientId,
}: {
  filled: boolean;
  half?: boolean;
  className?: string;
  size: string;
  gradientId: string;
}) {
  return (
    <svg
      className={cn(size, className)}
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {half && (
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        fill={half ? `url(#${gradientId})` : filled ? 'currentColor' : 'none'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function StarRating({
  value,
  totalRatings,
  interactive = false,
  size = 'md',
  onChange,
  userRating,
  showAverage = false,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const uid = useId();
  const dims = sizeClasses[size];

  const displayRating = showAverage ? value : (userRating ?? value);
  const totalStars = 5;

  const handlePointerMove = useCallback(
    (starNum: number, e: React.PointerEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setHovered(x < rect.width / 2 ? starNum - 0.5 : starNum);
    },
    []
  );

  const handleClick = useCallback(
    (starNum: number) => {
      if (interactive && onChange) {
        onChange(hovered > 0 ? hovered : starNum);
      }
    },
    [interactive, onChange, hovered]
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(0);
  }, []);

  // Determine fill state for a given star position: 'empty' | 'half' | 'full'
  const getStarFill = useCallback(
    (starNum: number): 'empty' | 'half' | 'full' => {
      const effectiveValue = interactive && hovered > 0 ? hovered : displayRating;
      if (starNum <= Math.floor(effectiveValue)) return 'full';
      if (starNum === Math.ceil(effectiveValue) && effectiveValue % 1 !== 0) return 'half';
      return 'empty';
    },
    [interactive, hovered, displayRating]
  );

  return (
    <div className={cn('flex items-center', dims.gap, className)}>
      <div
        className="flex items-center"
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={`${value.toFixed(1)} de 5 estrellas`}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: totalStars }, (_, i) => {
          const starNum = i + 1;
          const fill = getStarFill(starNum);
          const isFilled = fill === 'full';
          const isHalf = fill === 'half';
          const isHovered = interactive && hovered > 0 && starNum <= Math.ceil(hovered);
          const gradId = `${uid}-star-${i}`;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? 'radio' : undefined}
              aria-checked={interactive ? starNum === Math.round(displayRating) : undefined}
              aria-label={interactive ? `${starNum} estrella${starNum > 1 ? 's' : ''}` : undefined}
              onPointerMove={(e) => handlePointerMove(starNum, e)}
              onClick={() => handleClick(starNum)}
              className={cn(
                'transition-all duration-150',
                interactive
                  ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded'
                  : 'cursor-default',
                isHovered && 'scale-110',
                isFilled || isHalf
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--text-tertiary)]'
              )}
            >
              <StarIcon filled={isFilled} half={isHalf} size={dims.star} gradientId={gradId} />
            </button>
          );
        })}
      </div>
      {value > 0 && (
        <span className={cn('text-[var(--text-secondary)]', dims.text)}>
          {showAverage ? (
            <>{value.toFixed(1)}{totalRatings !== undefined && ` (${totalRatings})`}</>
          ) : userRating ? (
            <>{value.toFixed(1)}</>
          ) : null}
        </span>
      )}
    </div>
  );
}
