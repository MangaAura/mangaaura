'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, MessageSquare, Maximize, Minimize, Sun, Moon, ChevronLeft, ChevronRight, Loader2, Heart, Reply, Send } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Components
import PageViewer from '@/components/Reader/PageViewer';
import CommentDrawer from '@/components/Reader/CommentDrawer';
import ReadingProgress from '@/components/Reader/ReadingProgress';

// Hooks
import { useChapterComments } from '@/hooks/useChapterComments';
import { useReadingAnalytics } from '@/hooks/useReadingAnalytics';

interface ChapterData {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
  pageUrls: string[];
  viewCount: number;
  manga: {
    id: string;
    title: string;
    slug: string;
    coverUrl: string | null;
    authorId: string;
    authorName: string;
  };
}

interface ChaptersListResponse {
  chapters: {
    id: string;
    chapterNumber: number;
    title: string | null;
  }[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ReaderPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const mangaId = searchParams.get('mangaId');
  const chapterNumber = searchParams.get('chapterNumber');

  const [viewMode, setViewMode] = useState<'scroll' | 'paged'>('scroll');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Fetch chapter data
  const { data: chapterData, error: chapterError, isLoading: isLoadingChapter } = useSWR<ChapterData>(
    mangaId && chapterNumber ? `/api/manga/${mangaId}/chapters/${chapterNumber}` : null,
    fetcher
  );

  // Fetch chapters list for navigation
  const { data: chaptersList } = useSWR<ChaptersListResponse>(
    mangaId ? `/api/manga/${mangaId}/chapters` : null,
    fetcher
  );

  // Comments
  const { comments, isLoading: isLoadingComments, createComment: postComment, updateComment: replyToComment, likeComment } = useChapterComments(chapterData?.id ?? '');

  // Analytics
  const { trackPageTurn: trackPageView } = useReadingAnalytics({
    mangaId: chapterData?.mangaId ?? '',
    chapterId: chapterData?.id ?? '',
    chapterNumber: chapterData?.chapterNumber ?? 1,
    totalPages: chapterData?.totalPages ?? 0,
  });

  // Track page views
  useEffect(() => {
    if (chapterData) {
      trackPageView(currentPage + 1);
    }
  }, [currentPage, chapterData, trackPageView]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, chapterData?.totalPages]);

  const nextPage = useCallback(() => {
    if (chapterData && currentPage < chapterData.totalPages - 1) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, chapterData?.totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle loading and error states
  if (isLoadingChapter) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (chapterError || !chapterData) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">Error al cargar el capítulo</p>
          <Link href="/browse">
            <button className="px-4 py-2 bg-[var(--primary-hover)] text-[var(--text-primary)] rounded-lg hover:bg-blue-700 transition-colors">
              Volver al explorar
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const currentChapterNumber = parseInt(chapterNumber || '1');
  const prevChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber - 1);
  const nextChapter = chaptersList?.chapters.find(c => c.chapterNumber === currentChapterNumber + 1);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[var(--background)]' : 'bg-slate-100'}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border-strong)]">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/manga/${chapterData.manga.slug}`}>
              <button className="p-2 hover:bg-[var(--surface)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-sm font-medium text-[var(--text-primary)] truncate max-w-xs">
                {chapterData.manga.title}
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Capítulo {chapterData.chapterNumber}
                {chapterData.title && ` - ${chapterData.title}`}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showComments ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
              )}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14 flex">
        {/* Reader */}
        <div className={cn(
          "flex-1 transition-all duration-300",
          showComments ? "mr-80" : ""
        )}>
          {/* Page Viewer */}
          <PageViewer
            pages={chapterData.pageUrls}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            viewMode={viewMode}
            onNext={nextPage}
            onPrev={prevPage}
          />

          {/* Navigation Controls */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-[var(--background)]/90 backdrop-blur px-4 py-2 rounded-full border border-[var(--border-strong)]">
            <Link
              href={prevChapter ? `/reader?mangaId=${mangaId}&chapterNumber=${prevChapter.chapterNumber}` : '#'}
              className={cn(
                "p-2 rounded-full transition-colors",
                prevChapter
                  ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  : "text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <span className="text-sm text-[var(--text-primary)] min-w-[80px] text-center">
              {currentPage + 1} / {chapterData.totalPages}
            </span>

            <Link
              href={nextChapter ? `/reader?mangaId=${mangaId}&chapterNumber=${nextChapter.chapterNumber}` : '#'}
              className={cn(
                "p-2 rounded-full transition-colors",
                nextChapter
                  ? "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  : "text-[var(--text-muted)] cursor-not-allowed"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <CommentDrawer
            chapterId={chapterData.id}
            mangaId={chapterData.mangaId}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />
        )}
      </main>

      {/* Reading Progress */}
      <ReadingProgress
        currentChapter={chapterData.chapterNumber}
        totalChapters={chaptersList?.chapters.length ?? 1}
        chapters={chaptersList?.chapters.map(c => ({ id: c.id, number: c.chapterNumber, title: c.title })) ?? []}
        mangaId={chapterData.mangaId}
        currentPage={currentPage}
        totalPages={chapterData.totalPages}
        onChapterChange={(chapterNum) => {
          const chapter = chaptersList?.chapters.find(c => c.chapterNumber === chapterNum);
          if (chapter && mangaId) {
            window.location.href = `/reader?mangaId=${mangaId}&chapterNumber=${chapterNum}`;
          }
        }}
      />
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ReaderPageContent />
    </Suspense>
  );
}

  // Simple Comment Section for Reader (adapted for dark theme)
// Note: useState and useChapterComments are already imported at the top of the file
function SimpleCommentSection({ chapterId }: { chapterId: string }) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const {
    comments,
    isLoading,
    hasMore,
    loadMore,
    createComment: postComment,
    updateComment: replyToComment,
    likeComment,
  } = useChapterComments(chapterId);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await postComment(newComment);
    setNewComment('');
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await replyToComment(parentId, replyContent);
    setReplyContent('');
    setReplyingTo(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)]">
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* New Comment Form */}
      {session && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-hover)] text-[var(--text-primary)] rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              Comentar
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment: any) => (
          <div key={comment.id} className="bg-[var(--surface)]/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <img
                src={comment.user?.avatarUrl || `https://ui-avatars.com/api/?name=${comment.user?.username || 'U'}`}
                alt={comment.user?.username}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-[var(--text-primary)]">
                    {comment.user?.displayName || comment.user?.username}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{comment.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => likeComment(comment.id)}
                    className={cn(
                      "flex items-center gap-1 text-xs transition-colors",
                      comment.isLiked ? "text-pink-500" : "text-[var(--text-tertiary)] hover:text-pink-500"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", comment.isLiked && "fill-current")} />
                    {comment.likesCount || 0}
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
                  >
                    <Reply className="w-4 h-4" />
                    Responder
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <form
                    onSubmit={(e) => handleSubmitReply(e, comment.id)}
                    className="mt-3"
                  >
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Escribe una respuesta..."
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--primary-hover)] text-[var(--text-primary)] rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs"
                      >
                        <Send className="w-3 h-3" />
                        Responder
                      </button>
                    </div>
                  </form>
                )}

                {/* Replies */}
                {comment.replies?.length > 0 && (
                  <div className="mt-3 ml-4 pl-4 border-l border-[var(--border)] space-y-3">
                    {comment.replies.map((reply: any) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <img
                          src={reply.user?.avatarUrl || `https://ui-avatars.com/api/?name=${reply.user?.username || 'U'}`}
                          alt={reply.user?.username}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-[var(--text-primary)]">
                              {reply.user?.displayName || reply.user?.username}
                            </span>
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-primary)] mt-0.5">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-3 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-sm transition-colors"
        >
          Cargar más comentarios
        </button>
      )}
    </div>
  );
}
