import {
  Sword,
  BookOpen,
  Smile,
  Drama,
  Sparkles,
  Skull,
  DoorOpen,
  Wrench,
  Search,
  Heart,
  GraduationCap,
  Rocket,
  Flame,
  Coffee,
  Ghost,
  Monitor,
  AlertTriangle,
} from 'lucide-react';

export interface GenreCategory {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  slug: string;
  color: string;
}

export const GENRE_CATEGORIES: GenreCategory[] = [
  {
    labelKey: 'accion',
    icon: Sword,
    slug: 'accion',
    color:
      'bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  },
  {
    labelKey: 'aventura',
    icon: BookOpen,
    slug: 'aventura',
    color:
      'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  },
  {
    labelKey: 'comedia',
    icon: Smile,
    slug: 'comedia',
    color:
      'bg-orange-500/10 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]',
  },
  {
    labelKey: 'drama',
    icon: Drama,
    slug: 'drama',
    color:
      'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  },
  {
    labelKey: 'fantasia',
    icon: Sparkles,
    slug: 'fantasia',
    color:
      'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  },
  {
    labelKey: 'fantasia-oscura',
    icon: Skull,
    slug: 'fantasia-oscura',
    color:
      'bg-gray-700/10 text-gray-700 border-gray-500/20 hover:bg-gray-700/20 hover:shadow-[0_0_15px_rgba(55,55,55,0.3)]',
  },
  {
    labelKey: 'isekai',
    icon: DoorOpen,
    slug: 'isekai',
    color:
      'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 hover:bg-indigo-500/20 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]',
  },
  {
    labelKey: 'mecha',
    icon: Wrench,
    slug: 'mecha',
    color:
      'bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20 hover:shadow-[0_0_15px_rgba(100,116,139,0.3)]',
  },
  {
    labelKey: 'misterio',
    icon: Search,
    slug: 'misterio',
    color:
      'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  },
  {
    labelKey: 'romance',
    icon: Heart,
    slug: 'romance',
    color:
      'bg-pink-500/10 text-pink-700 border-pink-500/20 hover:bg-pink-500/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]',
  },
  {
    labelKey: 'escolar',
    icon: GraduationCap,
    slug: 'escolar',
    color:
      'bg-teal-500/10 text-teal-700 border-teal-500/20 hover:bg-teal-500/20 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]',
  },
  {
    labelKey: 'sci-fi',
    icon: Rocket,
    slug: 'sci-fi',
    color:
      'bg-cyan-500/10 text-cyan-700 border-cyan-500/20 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
  },
  {
    labelKey: 'shounen',
    icon: Flame,
    slug: 'shounen',
    color:
      'bg-red-600/10 text-red-600 border-red-600/20 hover:bg-red-600/20 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)]',
  },
  {
    labelKey: 'slice-of-life',
    icon: Coffee,
    slug: 'slice-of-life',
    color:
      'bg-yellow-600/10 text-yellow-700 border-yellow-600/20 hover:bg-yellow-600/20 hover:shadow-[0_0_15px_rgba(202,138,4,0.3)]',
  },
  {
    labelKey: 'sobrenatural',
    icon: Ghost,
    slug: 'sobrenatural',
    color:
      'bg-violet-500/10 text-violet-700 border-violet-500/20 hover:bg-violet-500/20 hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]',
  },
  {
    labelKey: 'sistema',
    icon: Monitor,
    slug: 'sistema',
    color:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  },
  {
    labelKey: 'terror',
    icon: AlertTriangle,
    slug: 'terror',
    color:
      'bg-gray-800/10 text-gray-800 border-gray-800/20 hover:bg-gray-800/20 hover:shadow-[0_0_15px_rgba(30,30,30,0.3)]',
  },
];
