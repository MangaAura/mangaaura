import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diff = now.getTime() - past.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 30) return `hace ${days}d`;

  return formatDate(date);
}

export function getRankColor(rank: string): string {
  switch (rank.toLowerCase()) {
    case 'novato':
      return 'text-slate-500';
    case 'lector shonen':
      return 'text-green-500';
    case 'otaku experto':
      return 'text-blue-500';
    case 'maestro otaku':
      return 'text-purple-500';
    case 'leyenda manga':
      return 'text-amber-500';
    default:
      return 'text-slate-500';
  }
}

export function getRankBgColor(rank: string): string {
  switch (rank.toLowerCase()) {
    case 'novato':
      return 'bg-slate-100';
    case 'lector shonen':
      return 'bg-green-100';
    case 'otaku experto':
      return 'bg-blue-100';
    case 'maestro otaku':
      return 'bg-purple-100';
    case 'leyenda manga':
      return 'bg-amber-100';
    default:
      return 'bg-slate-100';
  }
}
