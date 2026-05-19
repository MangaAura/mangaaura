'use client';

import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { EventsClient } from './EventsClient';


const VALID_TABS = ['active', 'voting', 'past'] as const;
const VALID_TYPES = ['ART_CHALLENGE', 'SPEEDREADING', 'COMMUNITY'] as const;
const LIMIT = 20;

interface SubData {
  id: string;
  eventId: string;
  userId: string;
  imageUrl: string;
  prompt: string | null;
  votes: number;
  user: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

interface EventData {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  prize: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  color: string | null;
  borderColor: string | null;
  _count: { submissions: number };
}

function EventsPageInner() {
  const searchParams = useSearchParams();

  const tab = VALID_TABS.includes(searchParams.get('tab') as typeof VALID_TABS[number])
    ? (searchParams.get('tab') as typeof VALID_TABS[number])
    : 'active';
  const typeFilter = VALID_TYPES.includes(searchParams.get('type') as typeof VALID_TYPES[number])
    ? (searchParams.get('type') as typeof VALID_TYPES[number])
    : undefined;
  const search = searchParams.get('search') || '';
  const highlight = searchParams.get('highlight') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  // Map tab to API status parameter
  let statusParam = 'ACTIVE';
  if (tab === 'voting') statusParam = 'VOTING';
  if (tab === 'past') statusParam = 'COMPLETED,CANCELLED';

  const [events, setEvents] = useState<EventData[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [voting, setVoting] = useState<{ event: EventData; submissions: SubData[] } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch session for user info
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.id) setUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  // Fetch events data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          status: statusParam,
          page: String(page),
          limit: String(LIMIT),
        });
        if (typeFilter) params.append('type', typeFilter);
        if (search) params.append('search', search);
        if (tab === 'voting') params.append('includeVoting', 'true');

        const response = await fetch(`/api/events?${params}`);
        if (!response.ok) throw new Error('Error al cargar eventos');
        const data = await response.json();

        setEvents(data.events || []);
        setTotalEvents(data.pagination?.total || 0);
        setVoting(data.voting || null);
      } catch (err) {
        setError('Error al cargar eventos');
        console.error('Error fetching events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tab, typeFilter, search, page, statusParam]);

  // Fetch user's voted submission (for voting tab)
  useEffect(() => {
    if (tab !== 'voting' || !userId) {
      setVotedId(null);
      return;
    }

    fetch(`/api/events/vote/my-vote`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.submissionId) setVotedId(data.submissionId);
      })
      .catch(() => {});
  }, [tab, userId]);

  // Build serialized events
  const serializedEvents: EventData[] = events.map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    status: e.status,
    prize: e.prize,
    startDate: e.startDate,
    endDate: e.endDate,
    imageUrl: e.imageUrl,
    color: e.color,
    borderColor: e.borderColor,
    _count: { submissions: e._count?.submissions || 0 },
  }));

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4" role="alert">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const types = ['ART_CHALLENGE', 'SPEEDREADING', 'COMMUNITY'] as const;

  return (
    <div className="text-[var(--text-primary)] pb-12">
      <EventsClient
        initialTab={tab}
        events={serializedEvents}
        totalEvents={totalEvents}
        page={page}
        limit={LIMIT}
        voting={voting}
        initialVotedId={votedId}
        userId={userId}
        search={search}
        typeFilter={typeFilter || ''}
        highlight={highlight}
        types={types}
      />
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );
}

export default function EventsPageContent() {
  return (
    <Suspense fallback={<EventsSkeleton />}>
      <EventsPageInner />
    </Suspense>
  );
}
