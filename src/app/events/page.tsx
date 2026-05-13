import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { Metadata } from 'next';
import { EventsClient } from './EventsClient';
import type { EventData } from '@/components/Event/EventCard';

export const metadata: Metadata = {
  title: 'Eventos | Inkverse',
  description: 'Participa en desafíos de arte IA, votaciones y eventos de la comunidad',
};

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

interface EventsPageProps {
  searchParams: Promise<{
    tab?: string;
    type?: string;
    status?: string;
    search?: string;
    highlight?: string;
    page?: string;
  }>;
}

const VALID_TABS = ['active', 'voting', 'past'] as const;
const VALID_TYPES = ['ART_CHALLENGE', 'SPEEDREADING', 'COMMUNITY'] as const;
const LIMIT = 20;

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  const tab = VALID_TABS.includes(params.tab as typeof VALID_TABS[number]) ? params.tab as typeof VALID_TABS[number] : 'active';
  const typeFilter = VALID_TYPES.includes(params.type as typeof VALID_TYPES[number]) ? params.type as typeof VALID_TYPES[number] : undefined;
  const search = params.search || '';
  const highlight = params.highlight || '';
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const session = await auth();
  const userId = session?.user?.id || null;

  // Determine status filter based on tab
  let statusFilter: string | string[] = 'ACTIVE';
  if (tab === 'voting') statusFilter = 'VOTING';
  if (tab === 'past') statusFilter = ['COMPLETED', 'CANCELLED'];

  // Build where clause
  const where: Record<string, unknown> = {};
  if (Array.isArray(statusFilter)) {
    where.status = { in: statusFilter };
  } else {
    where.status = statusFilter;
  }
  if (typeFilter) where.type = typeFilter;
  if (search) where.title = { contains: search };

  // Fetch events in parallel
  const [events, totalEvents, votingEvent, votedId] = await Promise.all([
    // Event list
    prisma.event.findMany({
      where,
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: tab === 'past' ? { endDate: 'desc' } : { startDate: 'asc' },
      skip: (page - 1) * LIMIT,
      take: LIMIT,
    }),
    // Total count
    prisma.event.count({ where }),
    // Voting event (for voting tab)
    tab === 'voting'
      ? prisma.event.findFirst({
          where: { status: 'VOTING' },
          include: {
            _count: { select: { submissions: true } },
            submissions: {
              include: {
                user: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { votes: 'desc' },
            },
          },
        })
      : Promise.resolve(null),
    // User's voted submission
    tab === 'voting' && userId
      ? prisma.eventVote.findFirst({
          where: {
            userId,
            submission: { event: { status: 'VOTING' } },
          },
          select: { submissionId: true },
        })
      : Promise.resolve(null),
  ]);

  // Serialize dates
  const serializedEvents: EventData[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    status: e.status,
    prize: e.prize,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    imageUrl: e.imageUrl,
    color: e.color,
    borderColor: e.borderColor,
    _count: { submissions: e._count.submissions },
  }));

  // Serialize voting data
  let serializedVoting: {
    event: EventData;
    submissions: SubData[];
  } | null = null;
  if (votingEvent) {
    serializedVoting = {
      event: {
        id: votingEvent.id,
        title: votingEvent.title,
        description: votingEvent.description,
        type: votingEvent.type,
        status: votingEvent.status,
        prize: votingEvent.prize,
        startDate: votingEvent.startDate.toISOString(),
        endDate: votingEvent.endDate.toISOString(),
        imageUrl: votingEvent.imageUrl,
        color: votingEvent.color,
        borderColor: votingEvent.borderColor,
        _count: { submissions: votingEvent._count.submissions },
      },
      submissions: votingEvent.submissions.map((s) => ({
        id: s.id,
        eventId: s.eventId,
        userId: s.userId,
        imageUrl: s.imageUrl,
        prompt: s.prompt ?? null,
        votes: s.votes,
        user: s.user,
      })),
    };
  }

  // Build filter options
  const types = ['ART_CHALLENGE', 'SPEEDREADING', 'COMMUNITY'] as const;

  return (
    <div className="text-[var(--text-primary)] pb-12">
      <EventsClient
        initialTab={tab}
        events={serializedEvents}
        totalEvents={totalEvents}
        page={page}
        limit={LIMIT}
        voting={serializedVoting}
        initialVotedId={votedId?.submissionId || null}
        userId={userId}
        search={search}
        typeFilter={typeFilter || ''}
        highlight={highlight}
        types={types}
      />
    </div>
  );
}
