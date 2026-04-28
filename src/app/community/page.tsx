'use client';

import React, { useState, useEffect } from 'react';
import { Users, Trophy, Calendar, Flame, MessageCircle, ShieldAlert, Loader2 } from 'lucide-react';
import SpoilerComment from '@/components/Community/SpoilerComment';
import Navbar from '@/components/Layout/Navbar';

interface ClanData {
  id: string;
  name: string;
  description: string | null;
  emblemUrl: string | null;
  leaderId: string;
  monthlyScore: number;
  totalScore: number;
  memberCount: number;
  createdAt: string;
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'clans' | 'events' | 'discussions'>('clans');
  const [clans, setClans] = useState<ClanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab !== 'clans') return;
    setLoading(true);
    fetch('/api/clans?sortBy=monthlyScore&order=desc&limit=20')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.clans) setClans(data.clans);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  const formatScore = (score: number) => {
    if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
    if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
    return String(score);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="max-w-6xl mx-auto space-y-8 p-6">

        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
          <h1 className="text-3xl font-extrabold tracking-tight w-full md:w-auto text-left">Comunidad Global</h1>

          <div className="flex bg-[var(--surface-elevated)] rounded-lg p-1 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('clans')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'clans' ? 'bg-[var(--surface)] shadow-sm text-accent-purple' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <Trophy size={16} /> Clanes
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'events' ? 'bg-[var(--surface)] shadow-sm text-accent-orange' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <Calendar size={16} /> Eventos
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'discussions' ? 'bg-[var(--surface)] shadow-sm text-accent-blue' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <MessageCircle size={16} /> Foro
            </button>
          </div>
        </header>

        {/* CLANS VIEW */}
        {activeTab === 'clans' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-gradient-to-r from-accent-purple/10 to-transparent p-6 rounded-2xl border border-accent-purple/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-accent-purple mb-1">Guerra de Clanes</h2>
                <p className="text-sm text-[var(--text-secondary)]">¡Lee mangas en grupo para ganar XP!</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
              </div>
            ) : clans.length === 0 ? (
              <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                <Trophy className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)] font-medium">Aún no hay clanes. ¡Crea el primero!</p>
              </div>
            ) : (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] bg-[var(--surface-elevated)] font-bold text-sm text-[var(--text-secondary)]">
                  <div className="col-span-1 text-center">Rango</div>
                  <div className="col-span-5">Nombre del Clan</div>
                  <div className="col-span-3 text-center">Miembros</div>
                  <div className="col-span-3 text-right pr-4">Puntuación</div>
                </div>

                {clans.map((clan, i) => {
                  const rank = i + 1;
                  const rankColor = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : rank === 3 ? 'text-orange-500' : '';
                  return (
                    <div key={clan.id} className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-colors items-center">
                      <div className={`col-span-1 text-center font-black text-xl ${rankColor}`}>#{rank}</div>
                      <div className="col-span-5 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full flex items-center justify-center text-xs font-bold">
                          {clan.name.charAt(0)}
                        </div>
                        <div>
                          <span>{clan.name}</span>
                          {clan.description && (
                            <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[200px]">{clan.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="col-span-3 text-center text-sm">
                        <Users size={14} className="inline mr-1 text-[var(--text-secondary)]" />{clan.memberCount}
                      </div>
                      <div className="col-span-3 text-right font-mono font-bold pr-4">{formatScore(clan.monthlyScore)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* EVENTS VIEW */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl col-span-full">
              <Calendar className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)] font-medium">Próximamente: eventos de la comunidad</p>
            </div>
          </div>
        )}

        {/* DISCUSSIONS VIEW */}
        {activeTab === 'discussions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                <h2 className="font-bold">Últimos Comentarios (Global)</h2>
              </div>

              <div className="flex flex-col">
                <SpoilerComment
                  user="Kira_Reader"
                  avatar="https://ui-avatars.com/api/?name=Kira&background=random"
                  content="Me encantó el capítulo de hoy, el estilo de arte en la página 15 fue increíble."
                  isSpoiler={false}
                  likes={24}
                  timeAgo="Hace 5 min"
                />
                <SpoilerComment
                  user="MangaFan99"
                  avatar="https://ui-avatars.com/api/?name=Manga+Fan&background=random"
                  content="No puedo creer que Gojo muriera al final de este arco."
                  isSpoiler={true}
                  likes={156}
                  timeAgo="Hace 12 min"
                />
                <SpoilerComment
                  user="Alex R."
                  avatar="https://ui-avatars.com/api/?name=Alex+R&background=random"
                  content="¿Alguien sabe cuándo sale el próximo capítulo?"
                  isSpoiler={false}
                  likes={5}
                  timeAgo="Hace 1 hora"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl">
                <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldAlert className="text-accent-red" size={20} /> IA Anti-Spoiler</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Nuestra IA analiza cada comentario en tiempo real. Si detecta spoilers, los oculta automáticamente.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
