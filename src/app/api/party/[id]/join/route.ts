/**
 * Join Party API
 *
 * POST: Unirse a una sala de lectura
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { partyService } from '@/core/services/PartyService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/party/[id]/join - Unirse a un party
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: partyId } = await params;
    const party = partyService.getParty(partyId);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    // Verificar si el usuario ya esta en el party
    const existingMember = party.members.find((m) => m.userId === session.user.id);
    if (existingMember) {
      return NextResponse.json({
        success: true,
        message: 'Already a member of this party',
        member: existingMember,
        party: {
          ...party,
          members: party.members.map((m) => ({
            userId: m.userId,
            username: m.username,
            avatarUrl: m.avatarUrl,
            currentPage: m.currentPage,
            isHost: m.isHost,
            isOnline: m.isOnline,
            joinedAt: m.joinedAt,
          })),
        },
      });
    }

    // Unirse al party
    const result = partyService.joinParty(partyId, {
      userId: session.user.id,
      username: session.user.name || 'Anonymous',
      avatarUrl: session.user.image || undefined,
    }, '');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to join party' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      member: result.member,
      party: {
        ...party,
        members: party.members.map((m) => ({
          userId: m.userId,
          username: m.username,
          avatarUrl: m.avatarUrl,
          currentPage: m.currentPage,
          isHost: m.isHost,
          isOnline: m.isOnline,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('[Party API] Error joining party:', error);
    return NextResponse.json(
      { error: 'Failed to join party' },
      { status: 500 }
    );
  }
}
