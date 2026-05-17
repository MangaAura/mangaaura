'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import { AchievementBadgeDisplay } from './AchievementBadgeDisplay';
import type { Difficulty } from '@/hooks/useAchievements';

interface UnlockAnimationProps {
  badgeId: string;
  name: string;
  rarity: Difficulty;
  xpReward: number;
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'circle' | 'star' | 'diamond';
}

const rarityColors: Record<Difficulty, string[]> = {
  EASY: ['#22c55e', '#16a34a', '#86efac', '#bbf7d0'],
  MEDIUM: ['#3b82f6', '#2563eb', '#93c5fd', '#bfdbfe'],
  HARD: ['#8b5cf6', '#7c3aed', '#c4b5fd', '#ddd6fe'],
  LEGENDARY: ['#f59e0b', '#ea580c', '#fbbf24', '#fcd34d'],
};

function generateParticles(count: number, rarity: Difficulty): Particle[] {
  const colors = rarityColors[rarity];
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      angle: Math.random() * Math.PI * 2,
      velocity: 2 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
      shape: (['circle', 'star', 'diamond'] as const)[Math.floor(Math.random() * 3)],
    });
  }
  return particles;
}

export function UnlockAnimation({
  badgeId,
  name,
  rarity,
  xpReward,
  onComplete,
  className,
}: UnlockAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'reveal' | 'celebrate' | 'complete'>('enter');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Phase 1: Enter - scale up from nothing
    timerRef.current = setTimeout(() => setPhase('reveal'), 400);

    // Phase 2: Reveal - show the badge
    const t2 = setTimeout(() => {
      setPhase('celebrate');
      setParticles(generateParticles(40, rarity));
    }, 1200);

    // Phase 3: Celebrate - burst particles, then fade
    const t3 = setTimeout(() => setPhase('complete'), 3200);

    // Phase 4: Complete - trigger callback and hide
    const t4 = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [rarity, onComplete]);

  const isEntering = phase === 'enter';
  const isRevealing = phase === 'reveal';
  const isCelebrating = phase === 'celebrate';
  const isComplete = phase === 'complete';

  const shapePath = useCallback((shape: 'circle' | 'star' | 'diamond', size: number) => {
    switch (shape) {
      case 'star':
        return `M${size/2},0 L${size*0.62},${size*0.38} L${size},${size*0.38} L${size*0.69},${size*0.62} L${size*0.82},${size} L${size/2},${size*0.75} L${size*0.18},${size} L${size*0.31},${size*0.62} L0,${size*0.38} L${size*0.38},${size*0.38} Z`;
      case 'diamond':
        return `M${size/2},0 L${size},${size/2} L${size/2},${size} L0,${size/2} Z`;
      default:
        return '';
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'transition-opacity duration-500',
        isComplete ? 'opacity-0' : 'opacity-100',
        className,
      )}
    >
      {/* Dark overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/70 backdrop-blur-sm',
          'transition-opacity duration-700',
          isEntering ? 'opacity-0' : 'opacity-100',
        )}
      />

      {/* Particle burst */}
      {isCelebrating && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-particle-burst"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                '--angle': `${p.angle}rad`,
                '--velocity': p.velocity,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1}s`,
              } as React.CSSProperties}
            >
              {p.shape === 'circle' ? (
                <div
                  className="rounded-full animate-spin"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    opacity: 0.8,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ) : (
                <svg
                  width={p.size}
                  height={p.size}
                  viewBox={`0 0 ${p.size} ${p.size}`}
                  className="animate-spin"
                  style={{
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                >
                  <path
                    d={shapePath(p.shape, p.size)}
                    fill={p.color}
                    opacity={0.8}
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Center badge reveal */}
      <div
        className={cn(
          'relative flex flex-col items-center gap-4 z-10',
          'transition-all duration-700 ease-out',
          isEntering && 'scale-0 opacity-0',
          isRevealing && 'scale-100 opacity-100',
          isCelebrating && 'scale-110',
          isComplete && 'scale-100 opacity-0',
        )}
      >
        {/* XP glow ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-2xl opacity-40',
            rarity === 'LEGENDARY' && 'bg-[#f59e0b]',
            rarity === 'HARD' && 'bg-[#8b5cf6]',
            rarity === 'MEDIUM' && 'bg-[#3b82f6]',
            rarity === 'EASY' && 'bg-[#22c55e]',
            'animate-pulse',
          )}
          style={{ width: '200px', height: '200px', top: '-40px', left: 'calc(50% - 100px)' }}
        />

        {/* Badge */}
        <AchievementBadgeDisplay
          badgeId={badgeId}
          name={name}
          rarity={rarity}
          isUnlocked={true}
          size="xl"
          showGlow={true}
        />

        {/* Unlock text */}
        <div className="text-center mt-2">
          <h2
            className={cn(
              'text-2xl font-extrabold tracking-tight',
              'transition-all duration-500',
              isEntering && 'translate-y-4 opacity-0',
              isRevealing && 'translate-y-0 opacity-100',
            )}
            style={{ transitionDelay: '0.3s' }}
          >
            ¡Logro Desbloqueado!
          </h2>

          <div
            className={cn(
              'flex items-center justify-center gap-2 mt-2',
              'transition-all duration-500',
              isEntering && 'translate-y-4 opacity-0',
              isRevealing && 'translate-y-0 opacity-100',
            )}
            style={{ transitionDelay: '0.5s' }}
          >
            <Sparkles className="w-5 h-5 text-[var(--warning)]" />
            <span className="text-lg font-bold text-[var(--warning)]">
              +{xpReward} XP
            </span>
            <Sparkles className="w-5 h-5 text-[var(--warning)]" />
          </div>
        </div>

        {/* Light rays */}
        {isCelebrating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={`ray-${i}`}
                className="absolute w-1 h-24 origin-bottom animate-light-ray"
                style={{
                  transform: `rotate(${i * 30}deg)`,
                  background: `linear-gradient(to top, ${
                    rarity === 'LEGENDARY' ? '#f59e0b' :
                    rarity === 'HARD' ? '#8b5cf6' :
                    rarity === 'MEDIUM' ? '#3b82f6' : '#22c55e'
                  }, transparent)`,
                  opacity: 0.3,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
