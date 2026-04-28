'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Layout/Navbar';
import ClanCard from '@/components/Clan/ClanCard';
import { Users, Trophy, Search, Plus, ChevronLeft, ChevronRight, Flame, Crown } from 'lucide-react';

interface Clan {
  id: string;
  name: string;
  description?: string;
  emblemUrl?: string;
  totalScore: number;
  monthlyScore: number;
  currentSeason: number;
  leaderId: string;
  createdAt: string;
  memberCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clans, setClans] = useState<Clan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('monthlyScore');
  const [userClanId, setUserClanId] = useState<string | null>(null);

  // Fetch user's clan membership
  useEffect(() => {
    if (session?.user) {
      fetchUserClan();
    }
  }, [session]);

  const fetchUserClan = async () => {
    try {
      const response = await fetch('/api/user/clan');
      if (response.ok) {
        const data = await response.json();
        setUserClanId(data.clanId);
      }
    } catch (error) {
      console.error('Error fetching user clan:', error);
    }
  };

  // Fetch clans
  useEffect(() => {
    fetchClans();
  }, [pagination.page, sortBy]);

  const fetchClans = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        order: sortBy === 'name' ? 'asc' : 'desc',
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/clans?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch clans');
      
      const data = await response.json();
      const normalizedClans: Clan[] = data.clans.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? undefined,
        emblemUrl: c.emblemUrl ?? undefined,
        totalScore: c.totalScore,
        monthlyScore: c.monthlyScore,
        currentSeason: c.currentSeason,
        leaderId: c.leaderId,
        createdAt: c.createdAt,
        memberCount: c.memberCount,
      }));
      setClans(normalizedClans);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching clans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchClans();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-primary">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary font-sans text-fg-primary pb-12">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-accent-purple/20 via-accent-blue/10 to-secondary border-b border-custom">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <Users className="text-accent-purple" size={36} />
                Clanes
              </h1>
              <p className="text-muted mt-2 text-lg">
                Únete a un clan y compite con otros lectores en las temporadas
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!userClanId && (
                <Link
                  href="/community/clans/create"
                  className="bg-accent-purple hover:bg-purple-700 text-[var(--text-primary)] px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-accent-purple/20"
                >
                  <Plus size={20} />
                  Crear Clan
                </Link>
              )}
              {userClanId && (
                <Link
                  href={`/community/clan/${userClanId}`}
                  className="bg-secondary border border-custom hover:border-accent-purple/50 text-fg-primary px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Crown size={20} className="text-yellow-500" />
                  Mi Clan
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        {/* Season Info Banner */}
        <div className="bg-gradient-to-r from-accent-red/10 to-accent-purple/10 border border-accent-red/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="text-accent-red" size={28} />
            <h2 className="text-xl font-bold">Temporada en Curso</h2>
          </div>
          <p className="text-muted">
            Compite con otros clanes para ganar recompensas exclusivas. 
            Los mejores clanes recibirán InkCoins y badges especiales al final de la temporada.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="bg-tertiary border border-custom rounded-lg px-4 py-2">
              <span className="text-xs text-muted uppercase font-semibold">Top 1</span>
              <p className="font-bold text-yellow-500 flex items-center gap-1">
                <Trophy size={14} /> 10,000 InkCoins
              </p>
            </div>
            <div className="bg-tertiary border border-custom rounded-lg px-4 py-2">
              <span className="text-xs text-muted uppercase font-semibold">Top 2</span>
              <p className="font-bold text-gray-400 flex items-center gap-1">
                <Trophy size={14} /> 5,000 InkCoins
              </p>
            </div>
            <div className="bg-tertiary border border-custom rounded-lg px-4 py-2">
              <span className="text-xs text-muted uppercase font-semibold">Top 3</span>
              <p className="font-bold text-orange-500 flex items-center gap-1">
                <Trophy size={14} /> 3,000 InkCoins
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Buscar clanes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary border border-custom rounded-xl pl-12 pr-4 py-3 text-fg-primary placeholder:text-muted focus:outline-none focus:border-accent-purple"
            />
          </form>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-secondary border border-custom rounded-xl px-4 py-3 text-fg-primary focus:outline-none focus:border-accent-purple"
          >
            <option value="monthlyScore">Puntuación Mensual</option>
            <option value="totalScore">Puntuación Total</option>
            <option value="name">Nombre</option>
          </select>
        </div>

        {/* Clans Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple"></div>
          </div>
        ) : clans.length === 0 ? (
          <div className="text-center py-20">
            <Users className="mx-auto text-muted mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">No se encontraron clanes</h3>
            <p className="text-muted mb-6">
              {searchQuery 
                ? 'Intenta con otra búsqueda' 
                : 'Sé el primero en crear un clan'}
            </p>
            {!userClanId && (
              <Link
                href="/community/clans/create"
                className="inline-flex items-center gap-2 bg-accent-purple hover:bg-purple-700 text-[var(--text-primary)] px-6 py-3 rounded-xl font-bold transition-all"
              >
                <Plus size={20} />
                Crear Clan
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clans.map((clan, index) => (
              <ClanCard
                key={clan.id}
                clan={clan}
                rank={index + 1 + (pagination.page - 1) * pagination.limit}
                isUserClan={clan.id === userClanId}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-custom hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === pagination.totalPages || 
                Math.abs(page - pagination.page) <= 2
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="text-muted px-2">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                      page === pagination.page
                        ? 'bg-accent-purple text-[var(--text-primary)]'
                        : 'border border-custom hover:bg-tertiary'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-custom hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
