import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-audit';
import { prisma } from '@/lib/prisma';
import { toSlug } from '@/lib/slug';
import { withRateLimit } from '@/lib/rate-limit-middleware';

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

    const rlResponse = await withRateLimit(req, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

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
    const { name, description, emblemUrl } = body;

    const updateData: any = {};

    if (description !== undefined) {
      updateData.description = description?.trim();
    }
    if (emblemUrl !== undefined) {
      updateData.emblemUrl = emblemUrl?.trim();
    }

    // Handle name change: validate uniqueness and regenerate slug
    if (name !== undefined && name?.trim()) {
      const trimmedName = name.trim();

      if (trimmedName.length < 3) {
        return NextResponse.json(
          { error: 'El nombre debe tener al menos 3 caracteres' },
          { status: 400 }
        );
      }

      if (trimmedName.length > 50) {
        return NextResponse.json(
          { error: 'El nombre no puede exceder 50 caracteres' },
          { status: 400 }
        );
      }

      // Check uniqueness (exclude current clan)
      const existingClan = await prisma.clan.findFirst({
        where: { name: trimmedName, id: { not: id } },
      });

      if (existingClan) {
        return NextResponse.json(
          { error: 'Ya existe un clan con ese nombre' },
          { status: 400 }
        );
      }

      // Generate new unique slug
      const baseSlug = toSlug(trimmedName);
      let slug = baseSlug;
      let slugCounter = 1;
      while (await prisma.clan.findFirst({ where: { slug, id: { not: id } } })) {
        slug = `${baseSlug}-${slugCounter++}`;
      }

      updateData.name = trimmedName;
      updateData.slug = slug;
    }

    const clan = await prisma.clan.update({
      where: { id },
      data: updateData,
    });

    // Audit log for description change
    if (description !== undefined) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_DESCRIPTION_UPDATED',
        targetId: id,
        targetType: 'CLAN',
        metadata: {
          clanName: clan.name,
          newDescription: description?.trim().slice(0, 300) || null,
        },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      });
    }

    // Audit log for name change
    if (name !== undefined && name?.trim() !== clan.name) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_NAME_UPDATED',
        targetId: id,
        targetType: 'CLAN',
        metadata: {
          oldName: clan.name,
          newName: name?.trim(),
        },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      });
    }

    // Audit log for emblem change
    if (emblemUrl !== undefined) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'CLAN_EMBLEM_UPDATED',
        targetId: id,
        targetType: 'CLAN',
        metadata: {
          clanName: clan.name,
        },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
      });
    }

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
  _req: NextRequest,
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

    const rlResponse = await withRateLimit(_req, session?.user?.id, 'default');
    if (rlResponse) return rlResponse;

    // Check if user is the clan leader
    const clanInfo = await prisma.clan.findUnique({ where: { id }, select: { name: true } });

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

    // Audit log for clan deletion
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CLAN_DELETED',
      targetId: id,
      targetType: 'CLAN',
      metadata: {
        clanName: clanInfo?.name || 'Unknown',
      },
      severity: 'WARNING',
      ipAddress: _req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || _req.headers.get('x-real-ip') || undefined,
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
