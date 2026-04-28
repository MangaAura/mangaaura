'use client';

import React, { useState } from 'react';
import { BarChart, Users, TrendingUp, Star, Shield, Zap, ChevronRight, Activity, BookOpen, AlertTriangle, Target, Award } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<'creator' | 'reader'>('creator');

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary">
      <Navbar />
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        
        {/* Header & Tabs */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mt-2 border-b border-custom pb-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-3xl font-extrabold tracking-tight">Panel de Control</h1>
          </div>
          
          <div className="flex bg-tertiary rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('creator')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'creator' ? 'bg-secondary shadow-sm text-accent-blue' : 'text-muted hover:text-fg-primary'}`}
            >
              Creator Studio
            </button>
            <button 
              onClick={() => setActiveTab('reader')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'reader' ? 'bg-secondary shadow-sm text-accent-orange' : 'text-muted hover:text-fg-primary'}`}
            >
              Reader Profile
            </button>
          </div>
        </header>

        {/* Creator View */}
        {activeTab === 'creator' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { title: "Total Readers", val: "124.5K", inc: "+12%", icon: <Users size={20} className="text-accent-blue" /> },
                { title: "Avg. Read Time", val: "14m 20s", inc: "+5%", icon: <TrendingUp size={20} className="text-accent-green" /> },
                { title: "Completion Rate", val: "68%", inc: "-2%", icon: <Target size={20} className="text-accent-orange" /> },
                { title: "Reported Typos", val: "42", inc: "Fixed 30", icon: <AlertTriangle size={20} className="text-accent-red" /> }
              ].map((kpi, i) => (
                <div key={i} className="card p-5 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted">{kpi.title}</span>
                    {kpi.icon}
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{kpi.val}</span>
                    <span className="text-xs font-medium mb-1 text-accent-green">{kpi.inc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Drop-off Chart Simulation */}
              <div className="card p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-4">Chapter Drop-off Rate</h3>
                <div className="h-48 flex items-end justify-between gap-2 border-b border-l border-custom pb-2 pl-2">
                  {[100, 95, 90, 85, 70, 68, 65, 60, 58, 55].map((val, i) => (
                    <div key={i} className="w-full bg-accent-blue/80 hover:bg-accent-blue rounded-t transition-all relative group" style={{ height: `${val}%` }}>
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-[var(--text-primary)] text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100">
                        Ch.{i+1}: {val}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted">
                  <span>Ch. 1</span>
                  <span>Ch. 5</span>
                  <span>Ch. 10</span>
                </div>
              </div>

              {/* Error Heatmap (Crowdsourcing) */}
              <div className="card p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-4">Crowdsource Error Heatmap</h3>
                <div className="space-y-4">
                  {[
                    { page: "Page 12", type: "Typo", user: "Alex R.", status: "Pending" },
                    { page: "Page 15", type: "Translation", user: "Maria P.", status: "Fixed" },
                    { page: "Page 22", type: "AI Artifact", user: "John D.", status: "Pending" }
                  ].map((report, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-tertiary rounded-lg border border-custom">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{report.page} <span className="text-muted font-normal">({report.type})</span></span>
                        <span className="text-xs text-muted">Reported by: {report.user}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${report.status === 'Fixed' ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-orange/20 text-accent-orange'}`}>
                        {report.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reader Gamification View */}
        {activeTab === 'reader' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-gradient-to-r from-secondary to-tertiary p-8 rounded-2xl shadow-sm border border-custom flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full border-4 border-accent-orange shadow-lg flex items-center justify-center bg-[var(--surface-elevated)] relative overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Alex+R&size=128&background=random" alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 w-full bg-black/60 text-[var(--text-primary)] text-center text-xs font-bold py-1">Lvl 42</div>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <h2 className="text-3xl font-bold flex items-center gap-2">Alex R. <Shield size={24} className="text-accent-purple" /></h2>
                  <p className="text-muted">Rango: Maestro Lector • Miembro de: Dragones Oscuros</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Nivel 42</span>
                    <span>1,250 / 2,000 XP</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full border border-custom overflow-hidden">
                    <div className="bg-gradient-to-r from-accent-orange to-accent-red h-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Achievements */}
              <div className="card p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Award size={20} className="text-accent-orange" /> Logros Desbloqueados</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { name: "Primer Paso", desc: "Leíste 1 manga", color: "bg-gray-200" },
                    { name: "Maratón", desc: "10 hrs leídas", color: "bg-accent-blue/20 text-accent-blue" },
                    { name: "Cazador de Typos", desc: "5 reportes", color: "bg-accent-purple/20 text-accent-purple" },
                    { name: "Meme Lord", desc: "50 likes en meme", color: "bg-accent-orange/20 text-accent-orange" },
                    { name: "Quiz Master", desc: "10 quizes 100%", color: "bg-accent-green/20 text-accent-green" },
                    { name: "Mecenas", desc: "Donaste 100 InkCoins", color: "bg-yellow-100 text-yellow-600" }
                  ].map((badge, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-3 bg-tertiary rounded-lg border border-custom hover:shadow-md transition-shadow cursor-pointer">
                      <div className={`w-12 h-12 rounded-full mb-2 flex items-center justify-center font-bold text-xl ${badge.color}`}>
                        ★
                      </div>
                      <span className="text-xs font-bold">{badge.name}</span>
                      <span className="text-[10px] text-muted">{badge.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clan Stats */}
              <div className="card p-6 rounded-xl border-t-4 border-t-accent-purple">
                <h3 className="font-bold text-lg mb-4">Métricas del Clan: Dragones Oscuros</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Posición Global</span>
                    <span className="text-xl font-black text-accent-purple">#4</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Tu contribución este mes</span>
                    <span className="font-bold">450 XP</span>
                  </div>
                  
                  <div className="pt-4 border-t border-custom">
                    <h4 className="text-xs font-bold text-muted mb-3 uppercase">Top Miembros</h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between text-sm"><span className="font-bold text-yellow-500">1. Kira</span> <span>1,200 XP</span></li>
                      <li className="flex justify-between text-sm"><span className="font-bold text-gray-400">2. Alex R. (Tú)</span> <span>450 XP</span></li>
                      <li className="flex justify-between text-sm"><span className="font-bold text-orange-400">3. L</span> <span>320 XP</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
