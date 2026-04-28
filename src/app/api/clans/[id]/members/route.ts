import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/clans/[id]/members - Obtener miembros del clan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const skip = (page - 1) * limit;

    // Check if clan exists
    const clan = await prisma.clan.findUnique({
      where: { id },
    });

    if (!clan) {
      return NextResponse.json(
        { error: 'Clan no encontrado' },
        { status: 404 }
      );
    }

    const [members, total] = await Promise.all([
      prisma.clanMembership.findMany({
        where: { clanId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              xpPoints: true,
              level: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { contributedScore: 'desc' },
          { joinedAt: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.clanMembership.count({
        where: { clanId: id },
      }),
    ]);

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clan members:', error);
    return NextResponse.json(
      { error: 'Error al cargar los miembros' },
      { status: 500 }
    );
  }
}
