import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['ADMIN', 'OWNER'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, testEmail, variables } = await request.json();
    if (!key || !testEmail) {
      return NextResponse.json({ error: 'key and testEmail are required' }, { status: 400 });
    }

    const DEFAULT_TEMPLATES: Record<string, { name: string; subject: string; html: string }> = {
      welcome: {
        name: 'Welcome Email',
        subject: 'Bienvenido a {{siteName}}',
        html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h1>Bienvenido, {{username}}!</h1><p>Gracias por registrarte en {{siteName}}.</p></div>',
      },
      'password-reset': {
        name: 'Password Reset',
        subject: 'Restablece tu contraseña - {{siteName}}',
        html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h1>Restablecer contraseña</h1><a href="{{resetUrl}}">Restablecer</a></div>',
      },
      'new-chapter': {
        name: 'New Chapter',
        subject: 'Nuevo capítulo: {{chapterTitle}} - {{mangaTitle}}',
        html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h1>Nuevo capítulo</h1><p>{{mangaTitle}} - Capítulo {{chapterNumber}}</p></div>',
      },
      achievement: {
        name: 'Achievement',
        subject: '¡Logro desbloqueado! - {{achievementName}}',
        html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h1>¡Felicidades!</h1><p>{{achievementDescription}}</p></div>',
      },
      'weekly-digest': {
        name: 'Weekly Digest',
        subject: 'Tu resumen semanal - {{siteName}}',
        html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;"><h1>Resumen semanal</h1><p>Nuevos: {{newMangas}} mangas, {{newChapters}} capítulos</p></div>',
      },
    };

    const template = DEFAULT_TEMPLATES[key];
    if (!template) {
      return NextResponse.json({ error: 'Invalid template key' }, { status: 400 });
    }

    let subject = template.subject;
    let html = template.html;

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
        html = html.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }

    // Replace remaining placeholders with defaults
    const defaults: Record<string, string> = {
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'MangaAura',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://mangaaura.com',
      username: testEmail.split('@')[0],
      email: testEmail,
      mangaTitle: 'Test Manga',
      chapterNumber: '1',
      chapterTitle: 'Chapter 1',
      chapterUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://mangaaura.com',
      achievementName: 'Test Achievement',
      achievementDescription: 'This is a test achievement',
      resetUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mangaaura.com'}/auth/reset-password?token=test`,
      newMangas: '5',
      newChapters: '12',
      readingStreak: '7',
    };

    Object.entries(defaults).forEach(([k, v]) => {
      subject = subject.replace(new RegExp(`{{${k}}}`, 'g'), v);
      html = html.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });

    await sendEmail({
      to: testEmail,
      subject,
      html,
    });

    return NextResponse.json({ success: true, message: `Test email sent to ${testEmail}` });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
