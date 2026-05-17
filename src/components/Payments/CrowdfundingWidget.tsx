'use client';

import { useState, useEffect } from 'react';
import { Target, Users, TrendingUp, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import ContributionModal from './ContributionModal';

interface CrowdfundingWidgetProps {
  chapterId: string;
  chapterTitle?: string;
}

interface Contributor {
  id: string;
  userId: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
}

interface CrowdfundingStatus {
  current: number;
  goal: number;
  contributors: number;
  percentage: number;
  isGoalReached: boolean;
}

interface CrowdfundingData {
  status: CrowdfundingStatus;
  contributors: Contributor[];
  userContribution: {
    id: string;
    amount: number;
    isAnonymous: boolean;
  } | null;
}

export default function CrowdfundingWidget({ chapterId, chapterTitle }: CrowdfundingWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CrowdfundingData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCrowdfundingData();
  }, [chapterId]);

  const fetchCrowdfundingData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/crowdfunding/chapter/${chapterId}`);
      
      if (!response.ok) {
        // If no crowdfunding goal is set, this is expected
        if (response.status === 404) {
          setData(null);
          return;
        }
        throw new Error('Error al cargar crowdfunding');
      }
      
      const crowdfundingData: CrowdfundingData = await response.json();
      setData(crowdfundingData);
    } catch (err) {
      console.error('Error fetching crowdfunding:', err);
      setError('No se pudo cargar la información del crowdfunding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContributionSuccess = () => {
    fetchCrowdfundingData();
  };

  // If no crowdfunding data (no goal set), don't render
  if (!isLoading && !data && !error) {
    return null;
  }

  if (isLoading) {
    return (
<div className="bg-[var(--surface)]/50 rounded-xl p-6 border border-[var(--border)]">
      <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
<div className="bg-[var(--surface)]/50 rounded-xl p-6 border border-[var(--border)]">
      <p className="text-sm text-[var(--text-tertiary)] text-center">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { status, contributors } = data;
  const topContributors = contributors.slice(0, 5);

  return (
    <>
      <div className="bg-[var(--primary)]/5 rounded-xl p-6 border border-[var(--primary)]/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
<div className="p-2 bg-[var(--primary)]/10 rounded-lg">
      <Target size={20} className="text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">Crowdfunding</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Apoya la creación de este capítulo
              </p>
            </div>
          </div>
          {status.isGoalReached && (
            <span className="px-2 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs font-bold rounded-full">
              Meta Alcanzada
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-bold text-[var(--text-primary)]">
              {status.current.toLocaleString()} / {status.goal.toLocaleString()} IC
            </span>
            <span className="font-bold text-[var(--primary)]">
              {status.percentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] transition-all duration-500"
              style={{ width: `${Math.min(status.percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
<div className="flex items-center gap-1 text-[var(--text-muted)]">
        <Users size={14} />
            <span>{status.contributors} contribuyentes</span>
          </div>
<div className="flex items-center gap-1 text-[var(--text-muted)]">
        <TrendingUp size={14} />
            <span>{status.current > 0 ? '+' : ''}{status.current.toLocaleString()} IC</span>
          </div>
        </div>

        {/* Contribute Button */}
        <Button
          onClick={() => setIsModalOpen(true)}
          className="w-full mb-4"
          variant="ink"
        >
          <Crown size={16} className="mr-2" />
          Contribuir
        </Button>

        {/* User's Contribution */}
        {data.userContribution && (
          <div className="mb-4 p-3 bg-[var(--primary)]/10 rounded-lg">
            <p className="text-sm text-[var(--text-secondary)]">
              Tu contribución:{' '}
<span className="font-bold text-[var(--primary)]">
                {data.userContribution.amount.toLocaleString()} IC
              </span>
              {data.userContribution.isAnonymous && (
                <span className="text-xs text-[var(--text-tertiary)] ml-2">(Anónimo)</span>
              )}
            </p>
          </div>
        )}

        {/* Top Contributors */}
        {topContributors.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-3">
              Top Contribuyentes
            </h4>
            <div className="space-y-2">
              {topContributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`
                      w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold
${index === 0 ? 'bg-[var(--warning)]/10 text-[var(--warning)]' :
                          index === 1 ? 'bg-[var(--surface-sunken)] text-[var(--text-primary)]' :
                        index === 2 ? 'bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]' :
                        'text-[var(--text-tertiary)]'}
                    `}>
                      {index + 1}
                    </span>
                    {contributor.isAnonymous || !contributor.user ? (
                      <span className="text-[var(--text-tertiary)] italic">Anónimo</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {contributor.user.avatarUrl ? (
                          <OptimizedImage
                            src={contributor.user.avatarUrl}
                            alt={contributor.user.username}
                            width={20}
                            height={20}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[var(--border)] flex items-center justify-center text-xs text-[var(--text-primary)]">
                            {contributor.user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-[var(--text-secondary)]">
                          {contributor.user.username}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {contributor.amount.toLocaleString()} IC
                  </span>
                </div>
              ))}
            </div>
            {contributors.length > 5 && (
              <p className="text-xs text-[var(--text-tertiary)] text-center mt-3">
                Y {contributors.length - 5} contribuyentes más
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contribution Modal */}
      <ContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chapterId={chapterId}
        chapterTitle={chapterTitle}
        currentAmount={status.current}
        goalAmount={status.goal}
        percentage={status.percentage}
        onSuccess={handleContributionSuccess}
      />
    </>
  );
}
