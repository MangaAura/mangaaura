'use client';

import { Settings, MessageSquare, AlertTriangle, Share2, Menu, X, ArrowLeft, Coins, Moon, Sun, Monitor, Coffee } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';

import { CrowdfundingWidget } from '@/components/Payments';

interface Manga {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  authorId: string;
  authorName: string;
  status: string;
}

interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  pageUrls: string[];
  viewCount: number;
  _count: {
    corrections: number;
    sponsorshipBids: number;
  };
}

interface ReaderLayoutProps {
  children: React.ReactNode;
  manga: Manga;
  chapter: Chapter;
  prevChapter: { chapterNumber: number } | null;
  nextChapter: { chapterNumber: number } | null;
  allChapters: { chapterNumber: number; title: string | null }[];
  isAuthenticated: boolean;
}

export default function ReaderLayout({
  children,
  manga,
  chapter,
  allChapters,
}: ReaderLayoutProps) {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState('night');
  const [showComments, setShowComments] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setIsSettingsOpen(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/manga/${manga.slug}/chapter/${chapter.chapterNumber}`;
    const title = `${manga.title} - Cap. ${chapter.chapterNumber}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Silently ignore share cancellation
    }
  };

  const handleReport = () => {
    const errorUrl = `${window.location.origin}/manga/${manga.slug}/chapter/${chapter.chapterNumber}`;
    const subject = `Reporte: ${manga.title} Cap. ${chapter.chapterNumber}`;
    const body = `Reporte de error en ${errorUrl}`;
    window.location.href = `mailto:soporte@mangaaura.es?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" data-theme={theme}>
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-all"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-secondary border-r border-custom transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-custom flex justify-between items-center bg-secondary">
          <Link href="/" className="font-bold text-lg text-accent-blue hover:text-accent-blue-hover flex items-center gap-2">
            <ArrowLeft size={16} /> Volver
          </Link>
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-tertiary transition-colors cursor-pointer" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>
      <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
        <div className="mb-6">
          <h2 className="font-bold text-xl mb-1">{manga.title}</h2>
          <p className="text-sm text-muted">Capítulo {chapter.chapterNumber}</p>
        </div>
        <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Capítulos</h3>
        <ul className="space-y-1">
          {allChapters.slice(0, 10).map((ch) => (
            <li key={ch.chapterNumber}>
              <Link 
                href={`/manga/${manga.slug}/chapter/${ch.chapterNumber}`}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all block ${
                  ch.chapterNumber === chapter.chapterNumber 
                    ? 'bg-accent-blue text-[var(--text-inverse)] shadow-md' 
                    : 'hover:bg-tertiary'
                }`}
              >
                Cap. {ch.chapterNumber} {ch.title && `- ${ch.title}`}
              </Link>
            </li>
          ))}
        </ul>

        {/* Crowdfunding Widget */}
        <div className="mt-6">
          <CrowdfundingWidget 
            chapterId={chapter.id} 
            chapterTitle={chapter.title || `Capítulo ${chapter.chapterNumber}`} 
          />
        </div>
      </div>
  </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-custom bg-secondary flex items-center justify-between px-4 z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={toggleSidebar} className="p-2 rounded hover:bg-tertiary transition-colors cursor-pointer" aria-label="Abrir menú">
              <Menu size={20} />
            </button>
        <div className="hidden sm:block">
          <h1 className="font-semibold truncate max-w-[200px] md:max-w-md">{manga.title}</h1>
          <p className="text-xs text-muted truncate">Cap. {chapter.chapterNumber}</p>
        </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="hidden sm:flex items-center px-3 py-1 bg-tertiary rounded-full mr-2">
              <Coins size={16} className="text-accent-orange mr-1" />
              <span className="text-sm font-bold">{(session?.user as { inkcoinsBalance?: number } | undefined)?.inkcoinsBalance ?? 0}</span>
            </div>
            
            <div className="relative">
              <button onClick={toggleSettings} className={`p-2 rounded transition-colors cursor-pointer ${isSettingsOpen ? 'bg-tertiary' : 'hover:bg-tertiary'}`} title="Configuración" aria-label="Configuración">
                <Settings size={20} />
              </button>
              
              {/* Settings Dropdown */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-secondary border border-custom rounded-xl shadow-xl py-2 z-50 animate-fade-in-up">
                  <div className="px-4 py-2 border-b border-custom mb-2">
                    <h3 className="font-semibold text-sm">Tema de Lectura</h3>
                  </div>
                  <button onClick={() => changeTheme('light')} className={`w-full flex items-center px-4 py-2 text-sm hover:bg-tertiary cursor-pointer ${theme === 'light' ? 'text-accent-blue font-medium' : ''}`}>
                    <Sun size={16} className="mr-3" /> Claro
                  </button>
                  <button onClick={() => changeTheme('sepia')} className={`w-full flex items-center px-4 py-2 text-sm hover:bg-tertiary cursor-pointer ${theme === 'sepia' ? 'text-accent-orange font-medium' : ''}`}>
                    <Coffee size={16} className="mr-3" /> Sepia
                  </button>
                  <button onClick={() => changeTheme('night')} className={`w-full flex items-center px-4 py-2 text-sm hover:bg-tertiary cursor-pointer ${theme === 'night' ? 'text-accent-blue font-medium' : ''}`}>
                    <Moon size={16} className="mr-3" /> Oscuro
                  </button>
                  <button onClick={() => changeTheme('oled')} className={`w-full flex items-center px-4 py-2 text-sm hover:bg-tertiary cursor-pointer ${theme === 'oled' ? 'text-accent-purple font-medium' : ''}`}>
                    <Monitor size={16} className="mr-3" /> OLED (Ahorro Batería)
                  </button>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowComments(!showComments)} className="p-2 rounded hover:bg-tertiary transition-colors cursor-pointer hidden sm:block" title="Comentarios" aria-label="Comentarios">
              <MessageSquare size={20} aria-hidden="true" />
            </button>

            <button onClick={handleReport} className="p-2 rounded hover:bg-tertiary transition-colors cursor-pointer" title="Reportar Error" aria-label="Reportar error">
              <AlertTriangle size={20} aria-hidden="true" />
            </button>
            <button onClick={handleShare} className="p-2 rounded hover:bg-tertiary transition-colors cursor-pointer" title="Compartir" aria-label="Compartir">
              <Share2 size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Reader Container */}
        <main className="flex-1 overflow-hidden bg-background relative">
          {children}
        </main>
      </div>
    </div>
  );
}
