/**
 * Email Templates for InkVerse
 * Beautiful, responsive HTML email templates
 */

interface EmailTemplateProps {
  title: string;
  preview?: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}

export function baseEmailTemplate({
  title,
  preview = 'InkVerse - Plataforma de Manga',
  content,
  ctaText,
  ctaUrl,
  footerText = 'Gracias por usar InkVerse',
}: EmailTemplateProps): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Responsive */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 20px !important; }
      .heading { font-size: 24px !important; }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-wrapper { background-color: #0f172a !important; }
      .email-content { background-color: #1e293b !important; }
      .text-primary { color: #f1f5f9 !important; }
      .text-secondary { color: #94a3b8 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div class="email-wrapper" style="background-color: #f8fafc; padding: 40px 20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; width: 100%;">
            <!-- Preview text (hidden) -->
            <tr>
              <td style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
                ${preview}
              </td>
            </tr>
            
            <!-- Header with logo -->
            <tr>
              <td align="center" style="padding-bottom: 30px;">
                <a href="https://inkverse.app" style="text-decoration: none;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); width: 60px; height: 60px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 32px; font-weight: bold;">I</span>
                  </div>
                </a>
                <h1 style="margin: 15px 0 0 0; font-size: 28px; font-weight: 700; color: #1e293b;" class="heading">InkVerse</h1>
              </td>
            </tr>
            
            <!-- Main content -->
            <tr>
              <td class="email-content" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div class="content" style="padding: 40px;">
                  <h2 class="text-primary" style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1e293b;">${title}</h2>
                  
                  <div class="text-secondary" style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    ${content}
                  </div>
                  
                  ${ctaText && ctaUrl ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          ${ctaText}
                        </a>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 30px 20px;">
                <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                  ${footerText}
                </p>
                <p style="margin: 15px 0 0 0; color: #94a3b8; font-size: 12px;">
                  © ${new Date().getFullYear()} InkVerse. Todos los derechos reservados.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">
                  <a href="https://inkverse.app/privacy" style="color: #64748b; text-decoration: underline;">Privacidad</a>
                  <span style="color: #cbd5e1; margin: 0 10px;">|</span>
                  <a href="https://inkverse.app/terms" style="color: #64748b; text-decoration: underline;">Términos</a>
                  <span style="color: #cbd5e1; margin: 0 10px;">|</span>
                  <a href="https://inkverse.app/support" style="color: #64748b; text-decoration: underline;">Soporte</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();

  const text = `
${title}

${content.replace(/<[^>]*>/g, '')}

${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : ''}

---
${footerText}
© ${new Date().getFullYear()} InkVerse
https://inkverse.app
  `.trim();

  return { html, text };
}

// Specific email templates

export function welcomeEmail(username: string): { html: string; text: string; subject: string } {
  const { html, text } = baseEmailTemplate({
    title: `¡Bienvenido a InkVerse, ${username}!`,
    preview: 'Descubre, lee y comparte manga de calidad',
    content: `
      <p>¡Nos alegra tenerte con nosotros!</p>
      <p style="margin-top: 15px;">InkVerse es tu nuevo hogar para:</p>
      <ul style="margin: 15px 0; padding-left: 20px; color: #475569;">
        <li>📚 Descubrir mangas increíbles</li>
        <li>✍️ Publicar tus propias historias</li>
        <li>🎮 Ganar recompensas mientras lees</li>
        <li>👥 Conectar con otros fans</li>
      </ul>
      <p style="margin-top: 15px;">Completa tu perfil y empieza a explorar ahora mismo.</p>
    `,
    ctaText: 'Explorar mangas',
    ctaUrl: 'https://inkverse.app/browse',
  });

  return { html, text, subject: '¡Bienvenido a InkVerse!' };
}

export function passwordResetEmail(resetUrl: string): { html: string; text: string; subject: string } {
  const { html, text } = baseEmailTemplate({
    title: 'Restablecer tu contraseña',
    preview: 'Solicitud de cambio de contraseña',
    content: `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="margin-top: 15px;">Si no realizaste esta solicitud, puedes ignorar este email. Tu contraseña actual seguirá siendo segura.</p>
      <p style="margin-top: 15px;">Para restablecer tu contraseña, haz clic en el botón de abajo. Este enlace expirará en 1 hora.</p>
    `,
    ctaText: 'Restablecer contraseña',
    ctaUrl: resetUrl,
    footerText: 'Si no solicitaste este cambio, contacta con soporte inmediatamente.',
  });

  return { html, text, subject: 'Restablecer contraseña - InkVerse' };
}

export function newChapterEmail(
  mangaTitle: string,
  chapterNumber: number,
  chapterTitle: string,
  chapterUrl: string,
  coverImage?: string
): { html: string; text: string; subject: string } {
  const { html, text } = baseEmailTemplate({
    title: `¡Nuevo capítulo de ${mangaTitle}!`,
    preview: `Capítulo ${chapterNumber}: ${chapterTitle}`,
    content: `
      ${coverImage ? `<img src="${coverImage}" alt="${mangaTitle}" style="width: 100%; max-width: 300px; border-radius: 8px; margin-bottom: 20px;" />` : ''}
      <p><strong>${mangaTitle}</strong> acaba de publicar un nuevo capítulo.</p>
      <p style="margin-top: 15px; font-size: 18px; color: #6366f1;">
        <strong>Capítulo ${chapterNumber}</strong>${chapterTitle ? `: ${chapterTitle}` : ''}
      </p>
      <p style="margin-top: 15px;">¡No esperes más para leerlo!</p>
    `,
    ctaText: 'Leer ahora',
    ctaUrl: chapterUrl,
    footerText: 'Puedes desactivar estas notificaciones en tu configuración de cuenta.',
  });

  return { html, text, subject: `¡Nuevo capítulo: ${mangaTitle}!` };
}

export function achievementUnlockedEmail(
  achievementName: string,
  achievementDescription: string,
  xpAwarded: number
): { html: string; text: string; subject: string } {
  const { html, text } = baseEmailTemplate({
    title: '🏆 ¡Logro desbloqueado!',
    preview: `Ganaste ${xpAwarded} XP`,
    content: `
      <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; margin-bottom: 20px;">
        <span style="font-size: 48px;">🏆</span>
        <h3 style="margin: 10px 0 0 0; color: white; font-size: 20px;">${achievementName}</h3>
      </div>
      <p><strong>${achievementName}</strong></p>
      <p style="margin-top: 10px; color: #475569;">${achievementDescription}</p>
      <p style="margin-top: 15px; padding: 12px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
        <strong style="color: #6366f1;">+${xpAwarded} XP</strong> ganados
      </p>
      <p style="margin-top: 15px;">¡Sigue leyendo para desbloquear más logros!</p>
    `,
    ctaText: 'Ver mi perfil',
    ctaUrl: 'https://inkverse.app/profile',
  });

  return { html, text, subject: `🏆 Logro desbloqueado: ${achievementName}` };
}

export function tipReceivedEmail(
  mangaTitle: string,
  tipAmount: number,
  fromUsername: string
): { html: string; text: string; subject: string } {
  const { html, text } = baseEmailTemplate({
    title: '💰 ¡Recibiste una propina!',
    preview: `${fromUsername} te envió ${tipAmount} InkCoins`,
    content: `
      <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; margin-bottom: 20px;">
        <span style="font-size: 48px;">💰</span>
        <h3 style="margin: 10px 0 0 0; color: white; font-size: 24px;">+${tipAmount} InkCoins</h3>
      </div>
      <p><strong>${fromUsername}</strong> te envió una propina por tu manga <strong>"${mangaTitle}"</strong>.</p>
      <p style="margin-top: 15px;">¡Gracias por crear contenido increíble para la comunidad!</p>
      <p style="margin-top: 15px; padding: 12px; background-color: #f1f5f9; border-radius: 8px;">
        Usa tus InkCoins para destacar tus mangas o canjearlos por recompensas exclusivas.
      </p>
    `,
    ctaText: 'Ver dashboard',
    ctaUrl: 'https://inkverse.app/creator/dashboard',
  });

  return { html, text, subject: `💰 ¡${tipAmount} InkCoins recibidos!` };
}

export function weeklyDigestEmail(
  newChaptersCount: number,
  popularMangas: { title: string; url: string }[],
  yourStats: { chaptersRead: number; xpGained: number }
): { html: string; text: string; subject: string } {
  const popularMangasHtml = popularMangas
    .map(m => `<li style="margin: 8px 0;"><a href="${m.url}" style="color: #6366f1; text-decoration: none;">${m.title}</a></li>`)
    .join('');

  const { html, text } = baseEmailTemplate({
    title: 'Tu resumen semanal de InkVerse',
    preview: `${newChaptersCount} nuevos capítulos esta semana`,
    content: `
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 20px; color: white; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px;">Tus estadísticas</h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <div style="font-size: 32px; font-weight: bold;">${yourStats.chaptersRead}</div>
            <div style="font-size: 12px; opacity: 0.9;">Capítulos leídos</div>
          </div>
          <div>
            <div style="font-size: 32px; font-weight: bold;">+${yourStats.xpGained}</div>
            <div style="font-size: 12px; opacity: 0.9;">XP ganados</div>
          </div>
        </div>
      </div>
      
      <h3 style="color: #1e293b; margin: 20px 0 10px 0;">📚 ${newChaptersCount} nuevos capítulos</h3>
      <p>Hay ${newChaptersCount} nuevos capítulos de tus mangas seguidos esta semana.</p>
      
      <h3 style="color: #1e293b; margin: 25px 0 10px 0;">🔥 Mangas populares</h3>
      <ul style="padding-left: 20px; color: #475569;">
        ${popularMangasHtml}
      </ul>
    `,
    ctaText: 'Ver novedades',
    ctaUrl: 'https://inkverse.app/browse',
    footerText: 'Este es tu resumen semanal. Puedes cambiar la frecuencia en tu configuración.',
  });

  return { html, text, subject: `📚 Tu resumen semanal - ${newChaptersCount} nuevos capítulos` };
}

export function verificationEmail(verificationUrl: string): { html: string; text: string; subject: string } {
  const { html, text } = baseEmailTemplate({
    title: 'Verifica tu cuenta',
    preview: 'Confirma tu email para activar tu cuenta',
    content: `
      <p>Gracias por registrarte en InkVerse.</p>
      <p style="margin-top: 15px;">Para completar tu registro y activar todas las funciones de tu cuenta, por favor verifica tu dirección de email haciendo clic en el botón de abajo.</p>
      <p style="margin-top: 15px;">Este enlace expirará en 24 horas.</p>
    `,
    ctaText: 'Verificar email',
    ctaUrl: verificationUrl,
    footerText: 'Si no creaste esta cuenta, puedes ignorar este email.',
  });

  return { html, text, subject: 'Verifica tu cuenta - InkVerse' };
}

export function securityAlertEmail(
  alertType: 'login' | 'password_change' | 'email_change',
  location?: string,
  device?: string
): { html: string; text: string; subject: string } {
  const alerts = {
    login: {
      title: '🔒 Nuevo inicio de sesión detectado',
      content: `<p>Detectamos un inicio de sesión en tu cuenta desde un nuevo dispositivo o ubicación.</p>`,
    },
    password_change: {
      title: '🔐 Tu contraseña ha sido cambiada',
      content: `<p>Tu contraseña de InkVerse fue cambiada recientemente.</p>`,
    },
    email_change: {
      title: '📧 Tu email ha sido actualizado',
      content: `<p>La dirección de email de tu cuenta fue actualizada.</p>`,
    },
  };

  const alert = alerts[alertType];
  const detailsHtml = location || device ? `
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
      ${location ? `<p style="margin: 5px 0; color: #475569;"><strong>Ubicación:</strong> ${location}</p>` : ''}
      ${device ? `<p style="margin: 5px 0; color: #475569;"><strong>Dispositivo:</strong> ${device}</p>` : ''}
      <p style="margin: 5px 0; color: #475569;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
    </div>
  ` : '';

  const { html, text } = baseEmailTemplate({
    title: alert.title,
    preview: 'Alerta de seguridad de tu cuenta',
    content: `
      ${alert.content}
      ${detailsHtml}
      <p style="margin-top: 15px;">Si fuiste tú, no necesitas hacer nada. Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente.</p>
    `,
    ctaText: 'Ver actividad de la cuenta',
    ctaUrl: 'https://inkverse.app/profile/security',
    footerText: 'Alerta de seguridad automática de InkVerse.',
  });

  return { html, text, subject: alert.title };
}
