'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Layout/Navbar';
import Link from 'next/link';
import { Users, Crown, Star, Shield, Trophy, BookOpen, Flame, Plus, ChevronRight } from 'lucide-react';

export default function ClanDetailPage({ params }: { params: { slug: string } }) {
  const [isMember, setIsMember] = useState(false);

  const clanName = params.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const members = [
    { rank: 1, name: 'ShadowMonarch_99', role: 'Líder', xp: 48200, pages: 12800, avatar: 'SM', color: 'from-yellow-500 to-amber-600' },
    { rank: 2, name: 'NightOwlReader', role: 'Oficial', xp: 41500, pages: 11200, avatar: 'NR', color: 'from-purple-500 to-pink-500' },
    { rank: 3, name: 'OtakuGirl_ES', role: 'Miembro', xp: 29000, pages: 8400, avatar: 'OG', color: 'from-accent-blue to-cyan-500' },
    { rank: 4, name: 'MangaHunter42', role: 'Miembro', xp: 24500, pages: 6300, avatar: 'MH', color: 'from-green-500 to-teal-500' },
    { rank: 5, name: 'Tokio_Fantasy', role: 'Miembro', xp: 18200, pages: 4900, avatar: 'TF', color: 'from-red-500 to-rose-500' },
  ];

  const seasonProgress = {
    pagesRead: 42800,
    pagesGoal: 100000,
    corrections: 23,
    position: 2
  };

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary pb-12">
      <Navbar />

      {/* Clan Banner */}
      <div className="relative bg-gradient-to-r from-accent-purple/30 via-accent-blue/20 to-secondary border-b border-custom overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10"></div>
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-5xl shadow-2xl border-2 border-white/10 flex-shrink-0">
              👑
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight">{clanName}</h1>
                <span className="bg-yellow-500/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded-full border border-yellow-500/30 flex items-center gap-1">
                  <Trophy size={12} /> Rango #2
                </span>
              </div>
              <p className="text-muted text-lg max-w-xl">Los lectores más voraces de la noche. Unidos por el amor al Dark Fantasy y los protagonistas anti-héroe.</p>
              <div className="flex items-center justify-center md:justify-start gap-6 mt-4 text-sm font-semibold text-muted">
                <span className="flex items-center gap-1.5"><Users size={16} className="text-accent-blue"/> {members.length} miembros</span>
                <span className="flex items-center gap-1.5"><Flame size={16} className="text-accent-red"/> Temp. Activa</span>
                <span className="flex items-center gap-1.5"><Star size={16} className="text-yellow-500"/> Fundado Oct 2025</span>
              </div>
            </div>
            <button
              onClick={() => setIsMember(!isMember)}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 flex-shrink-0 shadow-md ${isMember ? 'bg-tertiary border border-custom text-muted hover:bg-accent-red/10 hover:text-accent-red hover:border-accent-red/30' : 'bg-accent-purple hover:bg-purple-700 text-white shadow-lg shadow-accent-purple/30'}`}
            >
              {isMember ? <><Shield size={18} /> Salir del Clan</> : <><Plus size={18} /> Unirse al Clan</>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Season Stats */}
        <div className="space-y-6">
          <div className="bg-secondary border border-custom rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-custom pb-3">
              <Flame className="text-accent-red" size={20} /> Temporada en Curso
            </h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span>Páginas Leídas</span>
                  <span className="text-accent-blue">{seasonProgress.pagesRead.toLocaleString()} / {seasonProgress.pagesGoal.toLocaleString()}</span>
                </div>
                <div className="w-full bg-tertiary h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-accent-blue to-accent-purple h-full rounded-full" style={{ width: `${(seasonProgress.pagesRead / seasonProgress.pagesGoal) * 100}%` }}></div>
                </div>
                <p className="text-xs text-muted mt-1 text-right">{Math.round((seasonProgress.pagesRead / seasonProgress.pagesGoal) * 100)}% del objetivo</p>
              </div>

              <div className="flex justify-between items-center bg-tertiary border border-custom rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield size={16} className="text-accent-green" /> Correcciones Beta
                </div>
                <span className="font-black text-lg text-accent-green">{seasonProgress.corrections}</span>
              </div>

              <div className="flex justify-between items-center bg-tertiary border border-custom rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy size={16} className="text-yellow-500" /> Posición Global
                </div>
                <span className="font-black text-lg text-yellow-500"># {seasonProgress.position}</span>
              </div>
            </div>

            <div className="mt-5 bg-accent-purple/10 border border-accent-purple/30 rounded-xl p-4 text-center">
              <p className="text-xs text-accent-purple font-semibold">🏆 Si terminan en Top 3 al final del mes, ganarán un banner exclusivo y 5,000 InkCoins</p>
            </div>
          </div>
        </div>

        {/* Right: Members Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-secondary border border-custom rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-custom flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2"><Crown className="text-yellow-500" size={20} /> Miembros del Clan</h2>
              {isMember && (
                <button className="text-xs font-bold text-accent-blue hover:underline flex items-center gap-1">
                  Invitar amigos <ChevronRight size={14} />
                </button>
              )}
            </div>
            <div className="divide-y divide-custom">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-tertiary transition-colors">
                  <div className={`w-6 text-center font-black text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-500' : 'text-muted'}`}>{i + 1}</div>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xs font-black shadow-sm flex-shrink-0`}>{m.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm truncate">{m.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.role === 'Líder' ? 'bg-yellow-500/20 text-yellow-500' : m.role === 'Oficial' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-tertiary text-muted'}`}>{m.role}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5"><BookOpen size={11} className="inline mr-1" />{m.pages.toLocaleString()} páginas esta temporada</p>
                  </div>
                  <div className="text-right">
                    <div className="font-black">{m.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clan Feed */}
          <div className="bg-secondary border border-custom rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4 border-b border-custom pb-2">Actividad Reciente</h2>
            <div className="space-y-4">
              {[
                { user: 'ShadowMonarch_99', action: 'terminó de leer', target: 'Solo Leveling Cap. 179', time: 'Hace 15 min' },
                { user: 'NightOwlReader', action: 'donó 200 InkCoins a', target: 'Jujutsu Kaisen', time: 'Hace 1 hora' },
                { user: 'OtakuGirl_ES', action: 'realizó una corrección en', target: 'Omniscient Reader', time: 'Hace 3 horas' },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-accent-purple mt-2 flex-shrink-0"></div>
                  <p className="text-muted">
                    <span className="font-bold text-fg-primary">{act.user}</span> {act.action} <span className="font-semibold text-accent-blue">{act.target}</span>
                    <span className="text-xs ml-2 text-muted/60">{act.time}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
