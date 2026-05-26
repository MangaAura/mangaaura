/**
 * POST /api/economy/kyc/start
 * Start KYC verification process
 */

import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.kycStatus === 'approved') {
      return NextResponse.json(
        { error: 'Identidad ya verificada' },
        { status: 400 },
      );
    }

    if (user.kycStatus === 'pending') {
      return NextResponse.json(
        { error: 'Verificación ya en proceso' },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { kycStatus: 'pending' },
    });

    return NextResponse.json({
      success: true,
      message: 'Proceso de verificación iniciado',
      status: 'pending',
    });
  } catch (error) {
    console.error('[KYC Start] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}