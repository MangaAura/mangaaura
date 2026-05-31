import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  status: z.enum(['PENDING', 'READ', 'REPLIED', 'CLOSED']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const contactMessage = await prisma.contactMessage.update({
      where: { id },
      data: {
        ...(parsed.data.status && { status: parsed.data.status }),
        ...(parsed.data.adminNotes !== undefined && { adminNotes: parsed.data.adminNotes }),
      },
    });

    return NextResponse.json({ success: true, message: contactMessage });
  } catch (error) {
    console.error('[Contact Update API] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el mensaje' },
      { status: 500 }
    );
  }
}