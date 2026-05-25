import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/lib/rate-limit-middleware';

import { sendEmail } from '@/lib/email';

const DELETION_GRACE_PERIOD_DAYS = 30;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, username: true, markedForDeletionAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.markedForDeletionAt) {
      const alreadyScheduled = new Date(user.markedForDeletionAt) > new Date();
      if (alreadyScheduled) {
        return NextResponse.json({
          error: 'Tu cuenta ya está programada para eliminación',
          scheduledAt: user.markedForDeletionAt,
        }, { status: 400 });
      }
    }

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + DELETION_GRACE_PERIOD_DAYS);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { markedForDeletionAt: deletionDate },
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Solicitud de eliminación de cuenta - MangaAura',
        html: `
          <h1>Solicitud de eliminación de cuenta</h1>
          <p>Hola ${user.username},</p>
          <p>Hemos recibido una solicitud para eliminar tu cuenta de MangaAura.</p>
          <p>Tu cuenta será eliminada permanentemente el: <strong>${deletionDate.toLocaleDateString('es-ES')}</strong></p>
          <p>Si no solicitaste esta eliminación, por favor contacta a soporte inmediatamente.</p>
          <p>Para cancelar la eliminación, inicia sesión en MangaAura y ve a Configuración > Cuenta.</p>
        `,
      });
    } catch (emailError) {
      console.error('[AccountDeletion] Failed to send confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Tu cuenta ha sido marcada para eliminación',
      scheduledAt: deletionDate,
      gracePeriodDays: DELETION_GRACE_PERIOD_DAYS,
    });
  } catch (error) {
    console.error('[AccountDeletion] Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const rlResponse = await withRateLimit(request, session?.user?.id, 'default');
  if (rlResponse) return rlResponse;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { markedForDeletionAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!user.markedForDeletionAt) {
      return NextResponse.json({
        error: 'Tu cuenta no está marcada para eliminación',
      }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { markedForDeletionAt: null },
    });

    return NextResponse.json({
      success: true,
      message: 'La eliminación de tu cuenta ha sido cancelada',
    });
  } catch (error) {
    console.error('[AccountDeletion] Error canceling:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}