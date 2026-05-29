/**
 * Party Page API
 *
 * PUT: Actualizar página actual del party (solo host)
 */

import { NextRequest, NextResponse } from 'next/server';

import { partyService } from '@/core/services/PartyService';
import { auth } from '@/lib/auth';
import { withRateLimit } from '@/lib/rate-limit-middleware';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/party/[id]/page - Actualizar página (solo host)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();
    const page = typeof body.page === 'number' ? body.page : parseInt(body.page, 10);

    if (!Number.isFinite(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page number' },
        { status: 400 }
      );
    }

    const result = partyService.updatePage(partyId, session.user.id, page);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update page' },
        { status: result.error === 'Party not found' ? 404 : 403 }
      );
    }

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('[Party Page API] Error updating page:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}
