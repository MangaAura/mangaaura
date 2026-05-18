/**
 * API de Envío de Emails (Admin Only)
 * Permite envío manual de emails y en batch
 * @packageDocumentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { emailService } from '@/infrastructure/adapters/emailService';
import { getEmailQueue } from '@/infrastructure/queue/EmailQueue';
import { auth } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

// ============================================================================
// Schema de validación
// ============================================================================

const singleEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  text: z.string().optional(),
  type: z.enum([
    'welcome',
    'password-reset',
    'new-chapter',
    'achievement',
    'tip-received',
    'crowdfunding-goal-reached',
    'custom',
  ]),
});

const batchEmailSchema = z.object({
  emails: z.array(singleEmailSchema).min(1).max(100),
  delayBetweenMs: z.number().min(0).max(60000).default(100),
});

const welcomeEmailSchema = z.object({
  userId: z.string().uuid(),
});

// ============================================================================
// Helpers
// ============================================================================

async function isAdmin(userId: string): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === 'ADMIN';
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * POST /api/email/send
 * Envía un email o batch de emails
 * Requiere autenticación de admin
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('email-send', identifier), 10, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    // Verificar que sea admin
    if (!await isAdmin(session.user.id)) {
      return NextResponse.json(
        { error: 'Se requiere rol de administrador' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Si es un batch de emails
    if (body.emails) {
      return handleBatchEmail(body, session.user.id);
    }

    // Email individual según tipo
    switch (body.type) {
      case 'welcome':
        return handleWelcomeEmail(body);
      case 'password-reset':
        return handlePasswordResetEmail(body);
      case 'custom':
        return handleCustomEmail(body);
      default:
        return NextResponse.json(
          { error: 'Tipo de email no soportado' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Maneja envío de email de bienvenida
 */
async function handleWelcomeEmail(body: unknown) {
  const result = welcomeEmailSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: result.data.userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuario no encontrado' },
      { status: 404 }
    );
  }

  await emailService.sendWelcomeEmail(user);

  return NextResponse.json({
    success: true,
    message: 'Email de bienvenida enviado',
    to: user.email,
  });
}

/**
 * Maneja envío de email de recuperación de contraseña
 */
async function handlePasswordResetEmail(body: unknown) {
  const schema = z.object({
    email: z.string().email(),
    resetToken: z.string().min(1),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
    select: {
      id: true,
      email: true,
      username: true,
    },
  });

  if (!user) {
    // Por seguridad, no revelar si el email existe
    return NextResponse.json({
      success: true,
      message: 'Si el email existe, se enviará un email de recuperación',
    });
  }

  await emailService.sendPasswordResetEmail(user, result.data.resetToken);

  return NextResponse.json({
    success: true,
    message: 'Email de recuperación enviado',
    to: user.email,
  });
}

/**
 * Maneja envío de email personalizado
 */
async function handleCustomEmail(body: unknown) {
  const result = singleEmailSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { to, subject, html, text } = result.data;

  const sendResult = await emailService.sendEmail(to, {
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Fallback a texto plano sin HTML
  });

  if (!sendResult.success) {
    return NextResponse.json(
      { error: 'Error enviando email', details: sendResult.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Email enviado exitosamente',
    messageId: sendResult.messageId,
    to,
  });
}

/**
 * Maneja envío de batch de emails
 */
async function handleBatchEmail(body: unknown, adminId: string) {
  const result = batchEmailSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { emails, delayBetweenMs } = result.data;
  const queue = getEmailQueue();

  // Agregar emails a la cola con delay entre ellos
  const results = await Promise.all(
    emails.map(async (email: any, index: any) => {
      try {
        await queue.addEmailJob(
          'custom',
          {
            to: email.to,
            userId: adminId,
            username: 'admin',
            subject: email.subject,
            html: email.html,
            text: email.text || email.html.replace(/<[^>]*>/g, ''),
          },
          {
            delay: index * delayBetweenMs, // Delay progresivo
            priority: 5, // Prioridad baja para batch
          }
        );
        return { to: email.to, status: 'queued' };
      } catch (error) {
        return {
          to: email.to,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  const queued = results.filter((r: any) => r.status === 'queued').length;
  const failed = results.filter((r: any) => r.status === 'failed').length;

  return NextResponse.json({
    success: true,
    message: `${queued} emails agregados a la cola${failed > 0 ? `, ${failed} fallidos` : ''}`,
    stats: {
      total: emails.length,
      queued,
      failed,
    },
    results,
  });
}

/**
 * GET /api/email/send
 * Obtiene estadísticas de la cola de emails
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const identifier = session?.user?.id || ip;
    const rlResult = await rateLimit(getRateLimitKey('email-send', identifier), 10, 3600);
    if (!rlResult.allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlResult.resetAt - Date.now()) / 1000)) },
      });
    }

    // Verificar que sea admin
    if (!await isAdmin(session.user.id)) {
      return NextResponse.json(
        { error: 'Se requiere rol de administrador' },
        { status: 403 }
      );
    }

    const queue = getEmailQueue();
    const stats = await queue.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[Email API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
