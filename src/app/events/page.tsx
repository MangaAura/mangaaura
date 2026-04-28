'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Palette, Trophy, Clock, Users, Star, ChevronRight, Upload, Sparkles, ThumbsUp, Flame } from 'lucide-react';

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'voting' | 'past'>('active');
  const [votedId, setVotedId] = useState<number | null>(null);

  const activeEvents = [
    {
      id: 1,
      title: 'Desafío de Fan-Art: "Perdido en el Cosmos"',
      description: 'La plataforma lanza el prompt base del mes. Tu misión: generar una obra que muestre a un protagonista de anime perdido en el espacio exterior, con una estética visual retro-futurista.',
      basePrompt: 'An anime protagonist floating alone in deep space, retro-futuristic aesthetic, starfield background, melancholic expression, Makoto Shinkai style, cinematic, award winning digital art --ar 16:9 --niji 6',
      prize: '5,000 InkCoins + Banner Exclusivo',
      deadline: '7 días restantes',
      participants: 43,
      status: 'open' as const,
      color: 'from-blue-900/40 to-purple-900/40',
      borderColor: 'border-accent-blue/30'
    },
    {
      id: 2,
      title: 'Torneo de Speedreading: Semana Shounen',
      description: 'Lee la mayor cantidad de capítulos de mangas de género Shounen en 7 días. Los 3 usuarios con más capítulos completados ganan el podio de esta semana.',
      basePrompt: null,
      prize: '3,000 / 1,500 / 750 InkCoins',
      deadline: '3 días restantes',
      participants: 218,
      status: 'open' as const,
      color: 'from-red-900/40 to-orange-900/40',
      borderColor: 'border-accent-red/30'
    },
  ];

  const votingSubmissions = [
    { id: 1, user: 'CyberMangaka_AI', votes: 142, img: 'https://via.placeholder.com/400x300/10121a/5a6072?text=Entry+1', prompt: 'An anime hero in deep space retro-futuristic --niji 6' },
    { id: 2, user: 'StardustPainter', votes: 98, img: 'https://via.placeholder.com/400x400/10121a/5a6072?text=Entry+2', prompt: 'Floating astronaut anime girl retro style --v 6' },
    { id: 3, user: 'GalacticBrush', votes: 87, img: 'https://via.placeholder.com/400x250/10121a/5a6072?text=Entry+3', prompt: 'Lonely protagonist cosmos cinematic --ar 16:9 --niji 6' },
    { id: 4, user: 'NeonDreamer99', votes: 54, img: 'https://via.placeholder.com/400x350/10121a/5a6072?text=Entry+4', prompt: 'Space opera anime protagonist --midjourney' },
  ];

  const pastEvents = [
    { title: 'Desafío: "El Último Héroe"', winner: 'CyberMangaka_AI', date: 'Marzo 2026', participants: 67 },
    { title: 'Torneo de Clanes — Temporada 2', winner: 'Shadow Monarchs', date: 'Feb 2026', participants: 312 },
    { title: 'Desafío: "Ciudad Neon del Futuro"', winner: 'PixelSamurai_ES', date: 'Ene 2026', participants: 45 },
  ];

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary pb-12">
      <Navbar />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-pink-900/20 via-secondary to-purple-900/20 border-b border-custom overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute text-6xl select-none" style={{ left: `${(i * 7) % 100}%`, top: `${(i * 13) % 100}%`, opacity: 0.3 }}>🎨</div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-6 py-14 relative z-10 text-center">
          <div className="inline-flex justify-center items-center gap-2 bg-pink-500/10 text-pink-400 border border-pink-500/20 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
            <Flame size={14} /> EVENTO ESPECIAL ACTIVO
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Desafíos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Arte IA</span>
          </h1>
          <p className="text-muted text-xl max-w-2xl mx-auto">
            La plataforma da el prompt base. Tú generas el arte. La comunidad vota. El mejor gana InkCoins y reconocimiento eterno.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Tabs */}
        <div className="flex bg-tertiary border border-custom rounded-xl p-1 shadow-sm mb-8 max-w-sm">
          {(['active', 'voting', 'past'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all ${activeTab === tab ? 'bg-secondary shadow text-fg-primary' : 'text-muted hover:text-fg-primary'}`}>
              {tab === 'active' ? '🔴 Activos' : tab === 'voting' ? '🗳️ Votación' : '🏆 Pasados'}
            </button>
          ))}
        </div>

        {/* Active Events */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeEvents.map(event => (
              <div key={event.id} className={`bg-gradient-to-br ${event.color} border ${event.borderColor} rounded-3xl p-7 shadow-lg relative overflow-hidden`}>
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-[var(--surface-elevated)]/5 rounded-full blur-2xl"></div>

                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="bg-[var(--surface-elevated)]/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                    {event.basePrompt ? <Palette size={24} /> : <Trophy size={24} />}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold bg-[var(--surface-elevated)]/10 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm text-[var(--text-primary)]">
                    <Clock size={12} /> {event.deadline}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold mb-3 relative z-10 leading-tight">{event.title}</h2>
                <p className="text-[var(--text-primary)]/70 text-sm leading-relaxed mb-5 relative z-10">{event.description}</p>

                {event.basePrompt && (
                  <div className="bg-black/30 border border-white/10 rounded-xl p-3 mb-5 relative z-10">
                    <p className="text-[10px] text-[var(--text-primary)]/50 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Sparkles size={10} /> Prompt Base (libre de usar)</p>
                    <p className="text-xs font-mono text-[var(--text-primary)]/80 leading-relaxed line-clamp-2">{event.basePrompt}</p>
                  </div>
                )}

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4 text-xs text-[var(--text-primary)]/70 font-semibold">
                    <span className="flex items-center gap-1"><Users size={14} /> {event.participants} participantes</span>
                    <span className="flex items-center gap-1"><Trophy size={14} /> {event.prize}</span>
                  </div>
                  <button className="bg-[var(--surface-elevated)]/20 hover:bg-[var(--surface-elevated)]/30 backdrop-blur-sm text-[var(--text-primary)] text-sm font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-white/10">
                    <Upload size={16} /> Participar
                  </button>
                </div>
              </div>
            ))}

            {/* Submit Your Own */}
            <div className="bg-secondary border border-dashed border-custom rounded-3xl p-7 flex flex-col items-center justify-center text-center hover:bg-tertiary transition-colors cursor-pointer group">
              <div className="bg-tertiary border border-custom group-hover:border-accent-purple p-4 rounded-full mb-4 transition-colors">
                <Palette size={28} className="text-muted group-hover:text-accent-purple transition-colors" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-accent-purple transition-colors">¿Tienes una idea para un evento?</h3>
              <p className="text-sm text-muted mb-4">Propón un desafío y si la comunidad vota a favor, lo lanzaremos con recompensas oficiales.</p>
              <button className="bg-accent-purple/10 text-accent-purple border border-accent-purple/30 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-accent-purple hover:text-[var(--text-primary)] transition-all">
                Proponer Evento
              </button>
            </div>
          </div>
        )}

        {/* Voting Phase */}
        {activeTab === 'voting' && (
          <div>
            <div className="bg-secondary border border-custom rounded-2xl p-5 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Votación: "Ciudad Neon del Futuro" (Edición Anterior)</h2>
                <p className="text-muted text-sm mt-1">Cierra en: <span className="font-bold text-accent-red">23h 14m</span></p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted font-semibold">
                <Star className="text-yellow-500 fill-current" /> <span>Vota por tu favorita</span>
              </div>
            </div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {votingSubmissions.map(sub => (
                <div key={sub.id} className="break-inside-avoid bg-secondary border border-custom rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group">
                  <div className="relative">
                    <img src={sub.img} alt={`Entrada de ${sub.user}`} className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-[var(--text-primary)] text-xs font-bold px-2.5 py-1 rounded-lg">@{sub.user}</div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-mono text-muted bg-primary border border-custom rounded-lg p-2 mb-4 line-clamp-2">{sub.prompt}</p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-black text-lg">
                        <ThumbsUp className="text-accent-blue" size={20} /> {sub.votes}
                      </span>
                      <button
                        onClick={() => setVotedId(sub.id)}
                        disabled={votedId !== null}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${votedId === sub.id ? 'bg-accent-green text-[var(--text-primary)] cursor-default' : votedId !== null ? 'bg-tertiary text-muted cursor-not-allowed' : 'bg-accent-blue text-[var(--text-primary)] hover:bg-accent-blue-hover'}`}
                      >
                        {votedId === sub.id ? '✓ Votada' : 'Votar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {activeTab === 'past' && (
          <div className="bg-secondary border border-custom rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-custom">
              {pastEvents.map((evt, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-tertiary transition-colors">
                  <div>
                    <h4 className="font-bold">{evt.title}</h4>
                    <p className="text-xs text-muted mt-1">
                      🏆 Ganador: <span className="font-semibold text-yellow-500">{evt.winner}</span>
                      <span className="ml-3">• {evt.participants} participantes</span>
                      <span className="ml-3">• {evt.date}</span>
                    </p>
                  </div>
                  <button className="text-xs font-bold text-accent-blue hover:underline flex items-center gap-1">
                    Ver Galería <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
