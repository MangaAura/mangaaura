import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

const DEFAULT_TEMPLATES: Record<string, { name: string; description: string; subject: string; html: string }> = {
  welcome: {
    name: 'Welcome Email',
    description: 'Sent when a new user registers',
    subject: 'Bienvenido a {{siteName}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
<h1>Bienvenido, {{username}}!</h1>
<p>Gracias por registrarte en {{siteName}}.</p>
<p>¡Empieza a leer y crear manga ahora!</p>
<a href="{{siteUrl}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Comenzar</a>
</div>`,
  },
  'password-reset': {
    name: 'Password Reset',
    description: 'Sent when a user requests a password reset',
    subject: 'Restablece tu contraseña - {{siteName}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
<h1>Restablecer contraseña</h1>
<p>Haz clic en el enlace para restablecer tu contraseña:</p>
<a href="{{resetUrl}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Restablecer</a>
<p>Si no solicitaste esto, ignora este correo.</p>
</div>`,
  },
  'new-chapter': {
    name: 'New Chapter Notification',
    description: 'Sent when a followed manga publishes a new chapter',
    subject: 'Nuevo capítulo: {{chapterTitle}} - {{mangaTitle}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
<h1>Nuevo capítulo disponible</h1>
<p>{{mangaTitle}} - Capítulo {{chapterNumber}}: {{chapterTitle}}</p>
<a href="{{chapterUrl}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Leer ahora</a>
</div>`,
  },
  achievement: {
    name: 'Achievement Unlocked',
    description: 'Sent when a user unlocks an achievement',
    subject: '¡Logro desbloqueado! - {{achievementName}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
<h1>¡Felicidades, {{username}}!</h1>
<p>Has desbloqueado el logro: <strong>{{achievementName}}</strong></p>
<p>{{achievementDescription}}</p>
</div>`,
  },
  'weekly-digest': {
    name: 'Weekly Digest',
    description: 'Weekly summary of activity on the platform',
    subject: 'Tu resumen semanal - {{siteName}}',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
<h1>Tu resumen semanal</h1>
<p>Esta semana en {{siteName}}:</p>
<ul>
<li>Mangas nuevos: {{newMangas}}</li>
<li>Capítulos nuevos: {{newChapters}}</li>
<li>Tu racha de lectura: {{readingStreak}} días</li>
</ul>
<a href="{{siteUrl}}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">Explorar</a>
</div>`,
  },
};

let customTemplates: Record<string, { subject: string; html: string }> = {};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => ({
      key,
      name: tpl.name,
      description: tpl.description,
      subject: customTemplates[key]?.subject || tpl.subject,
      html: customTemplates[key]?.html || tpl.html,
      isCustom: !!customTemplates[key],
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: { key: string; subject: string; html: string } = await request.json();
    if (!body.key || !DEFAULT_TEMPLATES[body.key]) {
      return NextResponse.json({ error: 'Invalid template key' }, { status: 400 });
    }

    const isReset = !body.subject && !body.html;
    if (isReset) {
      delete customTemplates[body.key];
    } else {
      customTemplates[body.key] = { subject: body.subject, html: body.html };
    }

    return NextResponse.json({
      success: true,
      template: {
        key: body.key,
        ...DEFAULT_TEMPLATES[body.key],
        subject: isReset ? DEFAULT_TEMPLATES[body.key].subject : body.subject,
        html: isReset ? DEFAULT_TEMPLATES[body.key].html : body.html,
        isCustom: !isReset,
      },
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
