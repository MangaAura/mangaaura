/**
 * Leave Party API
 *
 * POST: Salir de una sala de lectura
 */

import { NextRequest, NextResponse } from 'next/server';

import { partyService } from '@/core/services/PartyService';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/party/[id]/leave - Salir de un party
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: partyId } = await params;
    const party = partyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Verificar si el usuario esta en el party
    const member = party.members.find((m) => m.userId === session.user.id);
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this party' },
        { status: 400 }
      );
    }

    // Salir del party
    const result = partyService.leaveParty(partyId, session.user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Left party successfully',
        wasHost: result.wasHost,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to leave party' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Party API] Error leaving party:', error);
    return NextResponse.json(
      { error: 'Failed to leave party' },
      { status: 500 }
    );
  }
}
