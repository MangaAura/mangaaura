import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/clans - Listar clanes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'monthlyScore'; // monthlyScore, totalScore, name
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (search) {
    where.name = { contains: search };
  }

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'name') {
      orderBy.name = order;
    } else {
      orderBy[sortBy] = order;
    }

    const [clans, total] = await Promise.all([
      prisma.clan.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.clan.count({ where }),
    ]);

    // Transform to include member count
    const clansWithMemberCount = clans.map((clan: any) => ({
      ...clan,
      memberCount: clan._count.members,
      _count: undefined,
    }));

  const response = NextResponse.json({
    clans: clansWithMemberCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
  
  // Cache headers
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return response;
} catch (error) {
  console.error('Error fetching clans:', error);
    return NextResponse.json(
      { error: 'Error al cargar los clanes' },
      { status: 500 }
    );
  }
}

// POST /api/clans - Crear un clan
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, description, emblemUrl } = body;

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 3 caracteres' },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: 'El nombre no puede exceder 50 caracteres' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    // Check if user is already in a clan
    const existingMembership = await prisma.clanMembership.findFirst({
      where: { userId },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Ya eres miembro de un clan. Debes salir antes de crear uno nuevo.' },
        { status: 400 }
      );
    }

    // Check if clan name is unique
    const existingClan = await prisma.clan.findUnique({
      where: { name: name.trim() },
    });

    if (existingClan) {
      return NextResponse.json(
        { error: 'Ya existe un clan con ese nombre' },
        { status: 400 }
      );
    }

    // Create clan with leader as first member
    const clan = await prisma.$transaction(async (tx: any) => {
      const newClan = await tx.clan.create({
        data: {
          name: name.trim(),
          description: description?.trim(),
          emblemUrl: emblemUrl?.trim(),
          leaderId: userId,
        },
      });

      await tx.clanMembership.create({
        data: {
          clanId: newClan.id,
          userId,
          role: 'LEADER',
        },
      });

      return newClan;
    });

    return NextResponse.json({ clan }, { status: 201 });
  } catch (error) {
    console.error('Error creating clan:', error);
    return NextResponse.json(
      { error: 'Error al crear el clan' },
      { status: 500 }
    );
  }
}
