import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { emailService } from '@/infrastructure/adapters/emailService';
import { auth } from '@/lib/auth';
import { baseEmailTemplate } from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';

const replySchema = z.object({
  to: z.string().email('Email inválido'),
  subject: z.string().min(1, 'El asunto es requerido').max(200),
  message: z.string().min(1, 'El mensaje es requerido').max(5000),
  replyToId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = replySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { html, text } = baseEmailTemplate({
      title: parsed.data.subject,
      preview: `Respuesta de MangaAura`,
      content: `
        <div style="padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <p style="margin: 0; color: #64748b; font-size: 13px;">Estás recibiendo este email porque contactaste con MangaAura. Esta es una respuesta a tu mensaje.</p>
        </div>
        <div style="white-space: pre-wrap;">${parsed.data.message}</div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          El equipo de MangaAura<br />
          <a href="https://mangaaura.es" style="color: #3b82f6;">mangaaura.es</a>
        </p>
      `,
      ctaText: 'Visitar MangaAura',
      ctaUrl: 'https://mangaaura.es',
    });

    await emailService.sendEmail(
      parsed.data.to,
      `Re: ${parsed.data.subject}`,
      html,
      text
    );

    if (parsed.data.replyToId) {
      await prisma.contactMessage.update({
        where: { id: parsed.data.replyToId },
        data: { status: 'REPLIED' },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Contact Reply API] Error:', error);
    return NextResponse.json(
      { error: 'Error al enviar el email' },
      { status: 500 }
    );
  }
}