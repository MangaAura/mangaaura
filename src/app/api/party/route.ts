/**
 * Party API
 *
 * POST: Crear una nueva sala de lectura
 * GET: Listar parties activas
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { partyService } from '@/core/services/PartyService';
import { z } from 'zod';
import { withRateLimit } from '@/lib/rate-limit-middleware';

const createPartySchema = z.object({
  mangaId: z.string().min(1, 'Manga ID is required'),
  chapterId: z.string().min(1, 'Chapter ID is required'),
});

// POST /api/party - Crear una nueva sala
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const body = await request.json();
    const result = createPartySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { mangaId, chapterId } = result.data;

    const party = partyService.createParty({
      mangaId,
      chapterId,
      user: {
        userId: session.user.id,
        username: session.user.name || 'Anonymous',
        avatarUrl: session.user.image || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      party: {
        ...party,
        inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reader/party/${party.partyId}`,
      },
    });
  } catch (error) {
    console.error('[Party API] Error creating party:', error);
    return NextResponse.json(
      { error: 'Failed to create party' },
      { status: 500 }
    );
  }
}

// GET /api/party - Listar parties activas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mangaId = searchParams.get('mangaId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    let parties = partyService.getAllParties();

    // Filtrar por manga si se especifica
    if (mangaId) {
      parties = parties.filter((p) => p.mangaId === mangaId);
    }

    // Limitar resultados
    parties = parties.slice(0, limit);

    // Ocultar socketIds y datos sensibles
    const sanitizedParties = parties.map((party) => ({
      partyId: party.partyId,
      mangaId: party.mangaId,
      chapterId: party.chapterId,
      hostId: party.hostId,
      memberCount: party.members.length,
      maxMembers: party.maxMembers,
      currentPage: party.currentPage,
      isReading: party.isReading,
      startedAt: party.startedAt,
    }));

    return NextResponse.json({
      parties: sanitizedParties,
      total: sanitizedParties.length,
    });
  } catch (error) {
    console.error('[Party API] Error fetching parties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parties' },
      { status: 500 }
    );
  }
}
