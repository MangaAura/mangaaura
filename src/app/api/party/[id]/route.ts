/**
 * Party Detail API
 *
 * GET: Obtener estado del party
 * DELETE: Cerrar el party (solo host)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { partyService } from '@/core/services/PartyService';
import { withRateLimit } from '@/lib/rate-limit-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/party/[id] - Obtener estado del party
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: partyId } = await params;

    const party = partyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Ocultar socketIds
    const sanitizedParty = {
      ...party,
      members: party.members.map((member) => ({
        userId: member.userId,
        username: member.username,
        avatarUrl: member.avatarUrl,
        currentPage: member.currentPage,
        isHost: member.isHost,
        isOnline: member.isOnline,
        joinedAt: member.joinedAt,
      })),
    };

    return NextResponse.json({
      party: sanitizedParty,
    });
  } catch (error) {
    console.error('[Party API] Error fetching party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch party' },
      { status: 500 }
    );
  }
}

// DELETE /api/party/[id] - Cerrar el party (solo host)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rlResponse = await withRateLimit(_request, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    const { id: partyId } = await params;
    const party = partyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Solo el host puede cerrar el party
    if (party.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only host can close the party' },
        { status: 403 }
      );
    }

    const success = partyService.closeParty(partyId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Party closed successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to close party' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Party API] Error closing party:', error);
    return NextResponse.json(
      { error: 'Failed to close party' },
      { status: 500 }
    );
  }
}
