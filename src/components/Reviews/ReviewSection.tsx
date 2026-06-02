'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US';
import {
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  Star as StarIcon,
  AlertCircle,
  Send,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';

import { StarRating } from '@/components/ui/StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocale, useT } from '@/i18n';
import { cn } from '@/lib/utils';

import { motion } from 'framer-motion';

interface ReviewUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
}

interface Review {
  id: string;
  userId: string;
  mangaId: string;
  rating: number;
  content: string | null;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}

interface ReviewSectionProps {
  mangaId: string;
  mangaSlug: string;
  averageRating: number | null;
}

export function ReviewSection({ mangaId, mangaSlug: _mangaSlug, averageRating }: ReviewSectionProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const t = useT();
  const dateLocale = locale === 'es' ? es : enUS;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [totalRatings, setTotalRatings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState('recent');
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (pageNum: number, sortBy: string, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '10');
      params.set('sort', sortBy);

      const res = await fetch(`/api/reviews/${mangaId}?${params}`);
      if (!res.ok) throw new Error(t('reviews.loadError'));
      const data = await res.json();

      if (append) {
        setReviews((prev) => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
        setDistribution(data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        setTotalRatings(data.totalRatings || 0);
        setUserReview(data.userReview || null);
        if (data.userReview) {
          setReviewRating(data.userReview.rating);
          setReviewContent(data.userReview.content || '');
        }
      }
      setHasMore(data.reviews?.length === 10);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reviews.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [mangaId]);

  useEffect(() => {
    setPage(1);
    fetchReviews(1, sort);
  }, [fetchReviews, sort]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, sort, true);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
  };

  const handleSubmitReview = async () => {
    if (!session?.user?.id) return;
    if (reviewRating === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/reviews/${mangaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, content: reviewContent }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t('reviews.submitError'));
      }
      const data = await res.json();
      setUserReview({ ...data.review, user: session.user as ReviewUser } as Review);
      setShowReviewForm(false);
      fetchReviews(1, sort);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('reviews.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    // For simplicity, just reset user review - in production would call DELETE API
    setUserReview(null);
    setReviewRating(0);
    setReviewContent('');
    fetchReviews(1, sort);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[var(--primary)]" />
          {t('reviews.title')}
          <span className="text-sm font-normal text-[var(--text-secondary)]">
            {t('reviews.count', { count: totalRatings })}
          </span>
        </h2>
        {session?.user?.id && !userReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {showReviewForm ? t('common.cancel') : t('reviews.writeReview')}
          </Button>
        )}
      </div>

      {/* Rating Distribution Chart */}
      {totalRatings > 0 && (
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Average score */}
            <div className="flex flex-col items-center gap-1 min-w-[100px]">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">
                {averageRating?.toFixed(1) || '0.0'}
              </span>
              <StarRating value={averageRating || 0} size="sm" showAverage />
              <span className="text-xs text-[var(--text-tertiary)]">
                {totalRatings} {totalRatings === 1 ? t('reviews.review') : t('reviews.reviews')}
              </span>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-right text-[var(--text-secondary)] font-medium">{star}</span>
                    <StarIcon className="w-3.5 h-3.5 text-[var(--warning)] fill-[var(--warning)]" />
                    <div className="flex-1 h-2.5 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[var(--warning)] to-amber-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-[var(--text-tertiary)]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Card className="p-5 border border-[var(--primary)]/30">
          <h3 className="font-semibold mb-3">{t('reviews.yourReview')}</h3>
          <div className="mb-3">
            <StarRating
              value={reviewRating}
              interactive
              size="lg"
              onChange={setReviewRating}
            />
            {reviewRating === 0 && (
              <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('reviews.selectRatingHint')}</p>
            )}
          </div>
          <textarea
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            placeholder={t('reviews.contentPlaceholder')}
            rows={4}
            maxLength={2000}
            className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/50 transition-colors placeholder:text-[var(--text-tertiary)]"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--text-tertiary)]">{reviewContent.length}/2000</span>
            {submitError && (
              <span className="text-xs text-[var(--error)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {submitError}
              </span>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleSubmitReview}
              disabled={reviewRating === 0 || isSubmitting}
              isLoading={isSubmitting}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {userReview ? t('reviews.updateReview') : t('reviews.publishReview')}
            </Button>
            {userReview && (
              <Button variant="ghost" onClick={handleDeleteReview} disabled={isSubmitting}>
                {t('common.delete')}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* User's existing review */}
      {userReview && !showReviewForm && (
        <Card className="p-5 border border-[var(--primary)]/20 bg-[var(--primary)]/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{t('reviews.yourReview')}</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(true)}>
              {t('common.edit')}
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <StarRating value={userReview.rating} size="sm" showAverage />
            <span className="text-sm font-medium">{userReview.rating}/5</span>
          </div>
          {userReview.content && (
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
              {userReview.content}
            </p>
          )}
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            {formatDistanceToNow(new Date(userReview.createdAt), { addSuffix: true, locale: dateLocale })}
          </p>
        </Card>
      )}

      {/* Sort controls */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-tertiary)]">{t('reviews.sortBy')}</span>
          {['recent', 'helpful', 'highest', 'lowest'].map((opt) => (
            <button
              key={opt}
              onClick={() => handleSortChange(opt)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-all',
                sort === opt
                  ? 'bg-[var(--primary)] text-[var(--text-inverse)]'
                  : 'bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
              )}
            >
              {opt === 'recent' ? t('reviews.sortRecent') :
               opt === 'helpful' ? t('reviews.sortHelpful') :
               opt === 'highest' ? t('reviews.sortHighest') :
               t('reviews.sortLowest')}
            </button>
          ))}
        </div>
      )}

      {/* Reviews list */}
      {isLoading && reviews.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-[var(--error)] mb-2" />
          <p className="text-sm text-[var(--error)]">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchReviews(1, sort)}>
            {t('common.retry')}
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title={t('reviews.emptyTitle')}
          description={t('reviews.emptyDescription')}
          icon={<MessageSquare className="w-12 h-12 text-[var(--text-tertiary)]" />}
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4 hover:bg-[var(--surface-sunken)]/50 transition-colors">
              <div className="flex items-start gap-3">
                <Link href={`/user/${review.user.username}`}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-[var(--surface-sunken)]">
                      {review.user.displayName?.[0] || review.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/user/${review.user.username}`}
                      className="font-medium text-sm text-[var(--text-primary)] hover:text-[var(--primary)]"
                    >
                      {review.user.displayName || review.user.username}
                    </Link>
                    <span className="text-xs text-[var(--text-tertiary)]">{t('reviews.levelAbbr')} {review.user.level}</span>
                    <span className="text-xs text-[var(--text-tertiary)]">·</span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: dateLocale })}
                    </span>
                  </div>
                  <div className="mt-1">
                    <StarRating value={review.rating} size="sm" showAverage />
                  </div>
                  {review.content && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2 whitespace-pre-line">
                      {review.content}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {t('reviews.helpful')} ({review.helpfulCount})
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !isLoading && reviews.length > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} isLoading={isLoading}>
            <ChevronDown className="w-4 h-4 mr-1" />
            {t('reviews.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
}


