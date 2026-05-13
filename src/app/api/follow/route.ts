import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { ToggleFollowUseCase } from '@/application/use-cases/follows/ToggleFollowUseCase';

const followSchema = z.object({
  followingId: z.string().uuid(),
  followingType: z.enum(['USER', 'MANGA']),
});

const toggleFollowUseCase = new ToggleFollowUseCase();

// POST /api/follow - Toggle follow
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = followSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { followingId, followingType } = result.data;

    const output = await toggleFollowUseCase.execute({
      followerId: session.user.id,
      targetId: followingId,
      targetType: followingType,
    });

    return NextResponse.json({
      success: output.success,
      isFollowing: output.isFollowing,
      message: output.message,
    });
  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/follow - Check if following
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const followingId = searchParams.get('followingId');
    const followingType = searchParams.get('followingType') as 'USER' | 'MANGA' | null;

    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false });
    }

    if (!followingId || !followingType) {
      return NextResponse.json(
        { error: 'followingId y followingType requeridos' },
        { status: 400 }
      );
    }

    const isFollowing = await import('@/core/services/FollowService').then(m => m.isFollowing({ followerId: session.user.id, followingId, followingType }));

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
