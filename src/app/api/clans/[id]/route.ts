import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/clans/[id] - Obtener detalle de un clan
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const byName = searchParams.get('byName') === '1';

    const whereClause: any = byName ? { name: id } : { id };

    const clan = await prisma.clan.findFirst({
      where: whereClause,
      include: {
        members: {
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
          ],
        },
      },
    });

    if (!clan) {
      return NextResponse.json(
        { error: 'Clan no encontrado' },
        { status: 404 }
      );
    }

    let userMembership = null;
    if (session?.user?.id) {
      const userId = session.user.id;
      userMembership = clan.members.find((m: any) => m.userId === userId) || null;
    }

    return NextResponse.json({
      clan: {
        ...clan,
        memberCount: clan.members.length,
      },
      userMembership,
    });
  } catch (error) {
    console.error('Error fetching clan:', error);
    return NextResponse.json(
      { error: 'Error al cargar el clan' },
      { status: 500 }
    );
  }
}

// PUT /api/clans/[id] - Actualizar clan (solo líder)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if user is the clan leader
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId: session.user.id,
        role: 'LEADER',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Solo el líder puede actualizar el clan' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { description, emblemUrl } = body;

    const clan = await prisma.clan.update({
      where: { id },
      data: {
        description: description?.trim(),
        emblemUrl: emblemUrl?.trim(),
      },
    });

    return NextResponse.json({ clan });
  } catch (error) {
    console.error('Error updating clan:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el clan' },
      { status: 500 }
    );
  }
}

// DELETE /api/clans/[id] - Eliminar clan (solo líder)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if user is the clan leader
    const membership = await prisma.clanMembership.findFirst({
      where: {
        clanId: id,
        userId: session.user.id,
        role: 'LEADER',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Solo el líder puede eliminar el clan' },
        { status: 403 }
      );
    }

    await prisma.clan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting clan:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el clan' },
      { status: 500 }
    );
  }
}
