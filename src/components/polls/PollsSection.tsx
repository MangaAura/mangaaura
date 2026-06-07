/**
 * PollsSection Component
 *
 * Displays polls with voting capabilities: progress bars, user vote indicator,
 * create poll form, and animated transitions.
 */

'use client';

import { useT } from '@/i18n';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ThumbsUp,
  User,
  Vote,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Input } from '@/components/ui/Input';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { StaggerContainer, StaggerItem } from '@/components/ui/StaggerContainer';
import { Textarea } from '@/components/ui/Textarea';
import { usePolls, type Poll } from '@/hooks/usePolls';

interface PollsSectionProps {
  limit?: number;
  showCreateForm?: boolean;
  title?: string;
  className?: string;
  status?: string;
}

function getTimeRemaining(expiresAt: string | null, t: ReturnType<typeof useT>): string {
  if (!expiresAt) return t('polls.noExpiry');
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return t('polls.finished');

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return t('polls.timeRemainingDays', { days, hours });
  if (hours > 0) return t('polls.timeRemainingHours', { hours });
  return t('polls.timeRemainingLessThanHour');
}

function PollOptionCard({
  option,
  totalVotes,
  isSelected,
  onVote,
  disabled,
}: {
  option: { id: string; text: string; voteCount?: number; percentage?: number };
  totalVotes: number;
  isSelected: boolean;
  onVote: () => void;
  disabled: boolean;
}) {
  const votes = option.voteCount ?? 0;
  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

  return (
    <button
      onClick={onVote}
      disabled={disabled}
      className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-300 group
        ${isSelected
          ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg shadow-[var(--primary)]/10'
          : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-sunken)]'
        }
        ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}
      `}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${isSelected
              ? 'border-[var(--primary)] bg-[var(--primary)]'
              : 'border-[var(--text-tertiary)] group-hover:border-[var(--primary)]'
            }
          `}>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-[var(--text-inverse)]" />
            )}
          </div>
          <span className={`font-medium text-sm ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
            {option.text}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {votes} {votes !== 1 ? 'votos' : 'voto'}
          </span>
          <span className="text-xs font-bold text-[var(--text-tertiary)] min-w-[3ch] text-right">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mt-3 h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isSelected
              ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]'
              : 'bg-[var(--text-tertiary)]/30 group-hover:bg-[var(--text-tertiary)]/50'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </button>
  );
}

function PollCard({
  poll,
  onVote,
  onRemoveVote,
  isVoting,
}: {
  poll: Poll;
  onVote: (optionId: string) => Promise<void>;
  onRemoveVote: () => Promise<void>;
  isVoting: boolean;
}) {
  const t = useT();
  const totalVotes = poll.options.reduce((sum, o) => sum + (o.voteCount ?? 0), 0);
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
  const canVote = poll.status === 'ACTIVE' && !isExpired && !poll.userVotedOptionId;
  const hasVoted = !!poll.userVotedOptionId;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-lg leading-snug">
              {poll.question}
            </CardTitle>
            {poll.description && (
              <CardDescription className="text-sm">
                {poll.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {poll.status === 'ACTIVE' && !isExpired ? (
              <Badge variant="success">{t('polls.active')}</Badge>
            ) : (
              <Badge variant="secondary">{t('polls.finished')}</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {poll.options.map((option) => (
          <PollOptionCard
            key={option.id}
            option={option}
            totalVotes={totalVotes}
            isSelected={poll.userVotedOptionId === option.id}
            onVote={() => onVote(option.id)}
            disabled={!canVote || isVoting}
          />
        ))}
      </CardContent>

      <CardFooter className="pt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)] border-t border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Vote className="w-3.5 h-3.5" />
            {totalVotes} {totalVotes !== 1 ? 'votos' : 'voto'}
          </span>
          {poll.createdBy && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {poll.createdBy.username}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {poll.expiresAt ? (
            <Calendar className="w-3.5 h-3.5" />
          ) : (
            <Clock className="w-3.5 h-3.5" />
          )}
          <span>{getTimeRemaining(poll.expiresAt, t)}</span>
        </div>
        {hasVoted && canVote && (
          <button
            onClick={onRemoveVote}
            disabled={isVoting}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors underline underline-offset-2"
          >
            {t('polls.removeVote')}
          </button>
        )}
      </CardFooter>
    </Card>
  );
}

function CreatePollForm({ onClose, onPollCreated }: { onClose: () => void; onPollCreated: () => void }) {
  const t = useT();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [expiresIn, setExpiresIn] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };
  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError(t('polls.questionRequired'));
      return;
    }
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setError(t('polls.minOptions'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let expiresAt: string | undefined;
    if (expiresIn !== '0') {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(expiresIn));
      expiresAt = d.toISOString();
    }

    const response = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question.trim(),
        description: description.trim() || undefined,
        options: validOptions,
        expiresAt,
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      onPollCreated();
      onClose();
    } else {
      const data = await response.json().catch(() => ({}));
      setError(data.error || t('polls.createError'));
    }
  };

  return (
    <Card className="border-[var(--primary)]/30 bg-[var(--surface)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('polls.newPoll')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <ErrorMessage message={error} />}

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {t('polls.question')} <span className="text-[var(--error)]">*</span>
          </label>
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('polls.questionPlaceholder')}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {t('polls.description')}
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('polls.descriptionPlaceholder')}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {t('polls.options')}
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={t('polls.optionPlaceholder', { number: index + 1 })}
                  maxLength={100}
                  className="flex-1"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors p-1"
                    aria-label={t('polls.removeOption', { number: index + 1 })}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addOption}
            className="text-sm text-[var(--primary)] hover:underline mt-1"
          >
            + {t('polls.addOption')}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {t('polls.duration')}
          </label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <option value="1">{t('polls.duration1Day')}</option>
            <option value="3">{t('polls.duration3Days')}</option>
            <option value="7">{t('polls.duration7Days')}</option>
            <option value="14">{t('polls.duration14Days')}</option>
            <option value="30">{t('polls.duration30Days')}</option>
            <option value="0">{t('polls.noExpiry')}</option>
          </select>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit} isLoading={isSubmitting}>
          <ThumbsUp className="w-4 h-4 mr-2" />
          {t('polls.create')}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function PollsSection({
  limit = 10,
  showCreateForm = true,
  title,
  className = '',
  status = 'ACTIVE',
}: PollsSectionProps) {
  const t = useT();
  const { data: session } = useSession();
  const { polls, isLoading, error, fetchPolls, vote, removeVote } = usePolls();
  const [showForm, setShowForm] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const loadPolls = useCallback(() => {
    fetchPolls({ status, limit });
  }, [fetchPolls, status, limit]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingId(pollId);
    await vote(pollId, optionId);
    setVotingId(null);
  };

  const handleRemoveVote = async (pollId: string) => {
    setVotingId(pollId);
    await removeVote(pollId);
    setVotingId(null);
  };

  if (!session?.user) {
    return (
      <EmptyState
        icon={<BarChart3 className="w-8 h-8" />}
        title={t('polls.loginRequired')}
        description={t('polls.loginRequiredDesc')}
        action={{ label: t('polls.login'), href: '/auth/login' }}
      />
    );
  }

  return (
    <section className={className}>
      <SectionTitle
        icon={<BarChart3 className="w-5 h-5" />}
        action={
          showCreateForm && !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {t('polls.newPoll')}
            </Button>
          ) : undefined
        }
      >
        {title || t('polls.title')}
      </SectionTitle>
      {showForm && (
        <div className="mb-6">
          <CreatePollForm onClose={() => setShowForm(false)} onPollCreated={loadPolls} />
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error}
          action={{ label: t('common.retry'), onClick: loadPolls }}
          className="mb-4"
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-[var(--surface-sunken)] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-8 h-8" />}
          title={t('polls.noActivePolls')}
          description={t('polls.noActivePollsDesc')}
          action={showCreateForm ? { label: t('polls.create'), onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <StaggerContainer className="space-y-4" staggerDelay={0.05}>
          {polls.slice(0, limit).map((poll) => (
            <StaggerItem key={poll.id}>
              <PollCard
                poll={poll}
                onVote={(optionId) => handleVote(poll.id, optionId)}
                onRemoveVote={() => handleRemoveVote(poll.id)}
                isVoting={votingId === poll.id}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </section>
  );
}
