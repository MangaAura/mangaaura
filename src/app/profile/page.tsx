'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import { Settings, Edit2, Share2, Award, Clock, Book, BookOpen, Flame, PieChart, Activity, Zap, Lock, Loader2 } from 'lucide-react';

interface Achievement {
  id: string;
  unlockedAt: string;
  name: string;
  description: string;
  icon: string;
}

interface UserActivity {
  id: string;
  type: string;
  description: string;
  metadata: string | null;
  createdAt: string;
}

interface ProfileData {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
    avatarUrl: string | null;
    xpPoints: number;
    inkcoinsBalance: number;
    level: number;
    readingStreak: number;
    lastReadAt: string | null;
    role: string;
    joinedAt: string;
    libraryCount: number;
    totalChaptersRead: number;
    nextLevelXp: number;
  };
  recentActivities: UserActivity[];
  achievements: Achievement[];
}

const activityIcons: Record<string, React.ReactNode> = {
  read: <BookOpen className="text-[var(--primary)]" size={16} />,
  tip: <Award className="text-yellow-500" size={16} />,
  correction: <Edit2 className="text-[var(--success)]" size={16} />,
  level_up: <Zap className="text-accent-purple" size={16} />,
  achievement: <Award className="text-yellow-500" size={16} />,
  default: <Activity className="text-[var(--text-secondary)]" size={16} />,
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'dna' | 'achievements'>('overview');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setProfile(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-[var(--text-secondary)]">No se pudo cargar el perfil.</p>
        </div>
      </div>
    );
  }

  const { user, recentActivities, achievements } = profile;
  const displayName = user.displayName || user.username;
  const avatarUrl = user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
  const xpPercent = Math.min(100, (user.xpPoints / user.nextLevelXp) * 100);
  const xpRemaining = user.nextLevelXp - user.xpPoints;

  const joinedDate = new Date(user.joinedAt).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const defaultAchievements = [
    { name: 'Bibliófilo', desc: 'Lee 1,000 páginas en total.', icon: '📚', unlocked: false },
    { name: 'Búho Nocturno', desc: 'Lee 5 capítulos de madrugada.', icon: '🦉', unlocked: false },
    { name: 'Corrector Beta', desc: 'Consigue que aprueben 1 sugerencia.', icon: '✍️', unlocked: false },
    { name: 'Mecenas', desc: 'Dona InkCoins por primera vez.', icon: '👑', unlocked: false },
    { name: 'Leyenda Viva', desc: 'Alcanza el nivel 10.', icon: '⚡', unlocked: false },
    { title: 'Speedreader', desc: 'Lee 50 capítulos en un día.', icon: '🏎️', unlocked: false },
  ];

  const mergedAchievements = defaultAchievements.map(def => {
    const unlocked = achievements.find(a => a.name === def.name);
    return {
      title: def.name,
      desc: def.desc,
      icon: def.icon,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt,
    };
  });

  achievements.forEach(a => {
    if (!mergedAchievements.find(m => m.title === a.name)) {
      mergedAchievements.unshift({
        title: a.name,
        desc: a.description,
        icon: a.icon,
        unlocked: true,
        unlockedAt: a.unlockedAt,
      });
    }
  });

  return (
    <div className="min-h-screen bg-[var(--background)] pb-12">
      <Navbar />

      <div className="relative h-48 bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 border-b border-[var(--border)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 -mt-16">
        {/* Profile Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
          <div className="relative">
            <img src={avatarUrl} alt={displayName} className="w-32 h-32 rounded-full ring-4 ring-[var(--background)] shadow-lg object-cover bg-[var(--surface-elevated)]" />
            <button className="absolute bottom-0 right-0 bg-[var(--primary)] text-white p-2 rounded-full shadow-md hover:bg-[var(--primary-hover)] transition-colors">
              <Edit2 size={16} />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center md:justify-start gap-3">
              {displayName}
              <span className="bg-accent-purple/10 text-accent-purple text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-accent-purple/20">
                <Zap size={12} fill="currentColor" /> Nivel {user.level}
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] font-medium mt-1">@{user.username} &bull; Se unió en {joinedDate}</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--surface-elevated)] border border-[var(--border)] hover:bg-[var(--border)] px-4 py-2 rounded-xl font-semibold transition-colors">
              <Share2 size={18} /> Compartir
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[var(--surface-elevated)] border border-[var(--border)] hover:bg-[var(--border)] px-4 py-2 rounded-xl font-semibold transition-colors">
              <Settings size={18} /> Ajustes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--surface-elevated)] rounded-xl p-1 mb-8 shadow-sm max-w-md">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 ${activeTab === 'overview' ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <Activity size={16} /> Resumen
          </button>
          <button onClick={() => setActiveTab('dna')} className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 ${activeTab === 'dna' ? 'bg-[var(--surface)] text-accent-purple shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <PieChart size={16} /> Manga DNA
          </button>
          <button onClick={() => setActiveTab('achievements')} className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 ${activeTab === 'achievements' ? 'bg-[var(--surface)] text-yellow-500 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <Award size={16} /> Logros
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="col-span-1 space-y-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">Progreso de Nivel</h3>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>{user.xpPoints.toLocaleString()} XP</span>
                  <span className="text-[var(--text-secondary)]">{user.nextLevelXp.toLocaleString()} XP</span>
                </div>
                <div className="w-full bg-[var(--surface-elevated)] h-3 rounded-full overflow-hidden mb-2">
                  <div className="bg-gradient-to-r from-[var(--primary)] to-accent-purple h-full rounded-full transition-all" style={{ width: `${xpPercent}%` }}></div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] text-center">Te faltan {xpRemaining.toLocaleString()} XP para el Nivel {user.level + 1}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm text-center">
                  <Flame className="mx-auto text-accent-red mb-2" size={24} />
                  <p className="text-2xl font-black">{user.readingStreak}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase">Días Seguidos</p>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm text-center">
                  <Book className="mx-auto text-[var(--primary)] mb-2" size={24} />
                  <p className="text-2xl font-black">{user.totalChaptersRead}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase">Capítulos Leídos</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm text-center">
                  <BookOpen className="mx-auto text-accent-purple mb-2" size={24} />
                  <p className="text-2xl font-black">{user.libraryCount}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase">En Biblioteca</p>
                </div>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm text-center">
                  <Award className="mx-auto text-yellow-500 mb-2" size={24} />
                  <p className="text-2xl font-black">{user.inkcoinsBalance.toLocaleString()}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase">InkCoins</p>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm h-full">
                <h3 className="font-bold mb-6 text-xl">Actividad Reciente</h3>
                {recentActivities.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-center py-8">Aún no hay actividad</p>
                ) : (
                  <div className="space-y-6">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="flex gap-4 items-start">
                        <div className="mt-1 bg-[var(--surface-elevated)] p-2 rounded-full border border-[var(--border)]">
                          {activityIcons[act.type] || activityIcons.default}
                        </div>
                        <div>
                          <p className="font-medium text-sm md:text-base">{act.description}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {new Date(act.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DNA Tab */}
        {activeTab === 'dna' && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8 shadow-sm animate-fade-in-up relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent-purple/10 rounded-full blur-[80px]"></div>
            <div className="absolute -left-20 bottom-0 w-64 h-64 bg-accent-blue/10 rounded-full blur-[80px]"></div>

            <div className="text-center mb-10 relative z-10">
              <h2 className="text-3xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent-blue to-accent-purple">Tu Manga DNA</h2>
              <p className="text-[var(--text-secondary)]">Tu perfil como lector basado en tu historial de lectura.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              <div className="bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><PieChart size={20} className="text-accent-purple" /> Estadísticas</h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <span className="font-semibold">Nivel</span>
                    <span className="font-black text-xl text-[var(--primary)]">{user.level}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <span className="font-semibold">InkCoins</span>
                    <span className="font-black text-xl text-yellow-500">{user.inkcoinsBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <span className="font-semibold">Racha</span>
                    <span className="font-black text-xl text-accent-red">{user.readingStreak} días</span>
                  </div>
                  <div className="flex items-center justify-between bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <span className="font-semibold">Biblioteca</span>
                    <span className="font-black text-xl text-accent-purple">{user.libraryCount} mangas</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Clock size={20} className="text-accent-blue" /> Hábitos de Lectura</h3>
                <div className="mb-8">
                  <p className="text-xs text-[var(--text-secondary)] font-bold uppercase mb-2">Última lectura</p>
                  <div className="flex items-center gap-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <div className="text-4xl">📖</div>
                    <div>
                      <h4 className="font-bold text-lg text-accent-blue">
                        {user.lastReadAt
                          ? new Date(user.lastReadAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                          : 'Sin lecturas aún'}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {user.readingStreak > 0
                          ? `Llevas ${user.readingStreak} días seguidos leyendo`
                          : '¡Empieza tu racha hoy!'}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-secondary)] font-bold uppercase mb-2">Capítulos leídos</p>
                  <div className="flex items-center justify-between bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <span className="font-semibold">Total</span>
                    <span className="font-black text-xl text-[var(--success)]">{user.totalChaptersRead}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in-up">
            {mergedAchievements.map((badge, i) => (
              <div key={i} className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center transition-all ${badge.unlocked ? 'shadow-sm hover:-translate-y-1' : 'opacity-50 grayscale'}`}>
                <div className={`text-4xl mb-4 inline-flex justify-center items-center w-16 h-16 rounded-full ${badge.unlocked ? 'bg-[var(--surface-elevated)] shadow-inner border border-[var(--border)]' : 'bg-[var(--background)] border-dashed border-2 border-[var(--border)]'}`}>
                  {badge.icon}
                </div>
                <h4 className="font-bold mb-1">{badge.title}</h4>
                <p className="text-xs text-[var(--text-secondary)]">{badge.desc}</p>
                {!badge.unlocked && (
                  <div className="mt-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-center items-center gap-1">
                    <Lock size={10} /> Bloqueado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
