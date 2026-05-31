import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { emailService } from '@/infrastructure/adapters/emailService';
import { auth } from '@/lib/auth';
import { baseEmailTemplate } from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  email: z.string().email('Ingresa un correo válido'),
  subject: z.string().min(1, 'El asunto es requerido').max(200),
  message: z.string().min(20, 'El mensaje debe tener al menos 20 caracteres').max(5000),
  category: z.enum(['general', 'support', 'dmca', 'business']).default('general'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rlResult = await rateLimit(getRateLimitKey('contact', ip), 3, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        category: parsed.data.category,
        userId,
      },
    });

    const categoryLabels: Record<string, string> = {
      general: 'General',
      support: 'Soporte',
      dmca: 'DMCA',
      business: 'Negocios',
    };

    const { html: emailHtml, text: emailText } = baseEmailTemplate({
      title: `📩 Nuevo mensaje de contacto`,
      preview: `De: ${parsed.data.name} <${parsed.data.email}>`,
      content: `
        <p><strong>Nombre:</strong> ${parsed.data.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${parsed.data.email}">${parsed.data.email}</a></p>
        <p><strong>Categoría:</strong> ${categoryLabels[parsed.data.category] || parsed.data.category}</p>
        <p><strong>Asunto:</strong> ${parsed.data.subject}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="white-space: pre-wrap;">${parsed.data.message}</p>
      `,
      ctaText: 'Ver en panel admin',
      ctaUrl: `https://mangaaura.es/admin/contact?id=${contactMessage.id}`,
    });

    await emailService.sendEmail('contact@mangaaura.es', {
      subject: `[MangaAura] ${parsed.data.subject} (${categoryLabels[parsed.data.category] || parsed.data.category})`,
      html: emailHtml,
      text: emailText,
    });

    const { html: confirmHtml, text: confirmText } = baseEmailTemplate({
      title: `✅ Mensaje recibido`,
      preview: `Gracias por contactarnos, ${parsed.data.name}`,
      content: `
        <p>Hola <strong>${parsed.data.name}</strong>,</p>
        <p style="margin-top: 15px;">Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
        <p style="margin-top: 15px;"><strong>Asunto:</strong> ${parsed.data.subject}</p>
        <p><strong>Categoría:</strong> ${categoryLabels[parsed.data.category] || parsed.data.category}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="white-space: pre-wrap; color: #64748b;">${parsed.data.message}</p>
        <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Este es un email automático de confirmación. No respondas a este email.</p>
      `,
      ctaText: 'Visitar MangaAura',
      ctaUrl: 'https://mangaaura.es',
    });

    await emailService.sendEmail(parsed.data.email, {
      subject: `✅ Hemos recibido tu mensaje - MangaAura`,
      html: confirmHtml,
      text: confirmText,
    });

    return NextResponse.json({ success: true, id: contactMessage.id });
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'MODERATOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100);

    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (category) where.category = category;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[Contact API] Error:', error);
    return NextResponse.json(
      { error: 'Error al cargar mensajes' },
      { status: 500 }
    );
  }
}
