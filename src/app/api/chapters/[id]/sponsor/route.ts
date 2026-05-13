import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sponsorSchema = z.object({
  bidAmount: z.number().int().min(10),
  sponsorName: z.string().min(1).max(50).optional(),
  message: z.string().max(100).optional(),
});

// POST /api/chapters/[id]/sponsor - Pujar por patrocinio
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id: chapterId } = await params;
    const body = await request.json();
    const result = sponsorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { bidAmount, sponsorName, message } = result.data;

    // Verificar capítulo
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar fondos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { inkcoinsBalance: true, username: true },
    });

    if (!user || user.inkcoinsBalance < bidAmount) {
      return NextResponse.json(
        { error: 'Fondos insuficientes', balance: user?.inkcoinsBalance || 0 },
        { status: 400 }
      );
    }

    // Verificar puja mínima
    const currentHighest = await prisma.sponsorshipBid.findFirst({
      where: { chapterId, status: 'ACTIVE' },
      orderBy: { bidAmount: 'desc' },
      select: { bidAmount: true },
    });

    const minBid = currentHighest ? currentHighest.bidAmount + 10 : 10;
    if (bidAmount < minBid) {
      return NextResponse.json(
        { error: `Puja mínima: ${minBid} InkCoins`, minBid },
        { status: 400 }
      );
    }

    // Marcar pujas anteriores como perdidas
    await prisma.sponsorshipBid.updateMany({
      where: { chapterId, status: 'ACTIVE' },
      data: { status: 'LOST' },
    });

    // Crear puja
    const bid = await prisma.sponsorshipBid.create({
      data: {
        chapterId,
        userId: session.user.id,
        bidAmount,
        status: 'ACTIVE',
        sponsorName: sponsorName || user.username,
        message,
      },
    });

    // Reservar fondos
    await prisma.user.update({
      where: { id: session.user.id },
      data: { inkcoinsBalance: { decrement: bidAmount } },
    });

    // Registrar transacción
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: -bidAmount,
        type: 'SPONSORSHIP_BID',
        referenceId: bid.id,
        description: `Puja patrocinio capítulo ${chapter.chapterNumber}`,
      },
    });

    return NextResponse.json({
      success: true,
      bid: {
        id: bid.id,
        amount: bidAmount,
        chapterId,
        sponsorName: bid.sponsorName,
        message: bid.message,
      },
      newBalance: user.inkcoinsBalance - bidAmount,
      isLeading: true,
      message: '¡Puja registrada! Eres el patrocinador líder.',
    });
  } catch (error) {
    console.error('Error en patrocinio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/chapters/[id]/sponsor - Ver pujas activas
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;

    const bids = await prisma.sponsorshipBid.findMany({
      where: { chapterId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { bidAmount: 'desc' }],
      take: 10,
    });

    const currentWinner = bids.find((b: any) => b.status === 'ACTIVE');

    return NextResponse.json({
      chapterId,
      currentWinner: currentWinner
        ? {
            userId: currentWinner.userId,
            username: currentWinner.user.username,
            avatarUrl: currentWinner.user.avatarUrl,
            bidAmount: currentWinner.bidAmount,
            sponsorName: currentWinner.sponsorName,
            message: currentWinner.message,
            createdAt: currentWinner.createdAt,
          }
        : null,
      bids: bids.map((b: any) => ({
        id: b.id,
        userId: b.userId,
        username: b.user.username,
        bidAmount: b.bidAmount,
        status: b.status,
        createdAt: b.createdAt,
      })),
      bidCount: bids.length,
      minNextBid: currentWinner ? currentWinner.bidAmount + 10 : 10,
    });
  } catch (error) {
    console.error('Error obteniendo pujas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
