/**
 * Templates de Email para MangaAura
 * Todos los templates incluyen versión HTML y texto plano
 * @packageDocumentation
 */

import { EmailTemplate } from '../EmailService';

// Colores y branding de MangaAura
const COLORS = {
  primary: '#6366f1', // Indigo 500
  primaryDark: '#4f46e5', // Indigo 600
  secondary: '#ec4899', // Pink 500
  background: '#0f172a', // Slate 900
  surface: '#1e293b', // Slate 800
  text: '#f8fafc', // Slate 50
  textMuted: '#94a3b8', // Slate 400
  success: '#22c55e', // Green 500
  warning: '#f59e0b', // Amber 500
};

const APP_URL = process.env.NEXTAUTH_URL || 'https://mangaaura.es';

// ============================================================================
// Layout Base
// ============================================================================

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MangaAura</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${COLORS.background};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: ${COLORS.text};
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${COLORS.surface};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
      color: white;
    }
    .header p {
      margin: 8px 0 0;
      color: rgba(255,255,255,0.9);
      font-size: 14px;
    }
    .content {
      padding: 32px 24px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .button:hover {
      background: linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%);
    }
    .footer {
      background-color: ${COLORS.background};
      padding: 24px;
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .footer p {
      margin: 0;
      color: ${COLORS.textMuted};
      font-size: 12px;
    }
    .footer a {
      color: ${COLORS.primary};
      text-decoration: none;
    }
    .highlight {
      color: ${COLORS.secondary};
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: ${COLORS.primary};
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .card {
      background-color: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .cover-image {
      width: 100%;
      max-width: 200px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      margin: 16px 0;
    }
    @media (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
`;
}

function baseHeader(): string {
  return `
    <div class="header">
      <h1>🌌 MangaAura</h1>
      <p>Tu universo de manga comienza aquí</p>
    </div>
`;
}

function baseFooter(): string {
  return `
    <div class="footer">
      <p>MangaAura © ${new Date().getFullYear()} - Todos los derechos reservados</p>
      <p style="margin-top: 8px;">
        <a href="${APP_URL}/settings/notifications">Gestionar preferencias de email</a> |
        <a href="${APP_URL}/privacy">Política de privacidad</a>
      </p>
    </div>
`;
}

// ============================================================================
// Welcome Template
// ============================================================================

export function getWelcomeTemplate(username: string): EmailTemplate {
  const subject = `¡Bienvenido a MangaAura, ${username}! 🎉`;

  const html = baseTemplate(`
    ${baseHeader()}
    <div class="content">
      <h2 style="color: ${COLORS.text}; margin-top: 0;">¡Hola ${username}! 👋</h2>
      
      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6;">
        Bienvenido a <span class="highlight">MangaAura</span>, tu nuevo hogar para descubrir, leer y crear mangas increíbles.
      </p>

      <div class="card">
        <h3 style="color: ${COLORS.text}; margin-top: 0;">🎁 Bonus de bienvenida</h3>
        <p style="color: ${COLORS.textMuted}; margin: 0;">
          Hemos agregado <span class="highlight">50 Aura</span> a tu cuenta para que empieces a disfrutar.
        </p>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6;">
        Con MangaAura puedes:
      </p>
      
      <ul style="color: ${COLORS.textMuted}; line-height: 1.8;">
        <li>📚 Descubrir miles de mangas únicos</li>
        <li>⭐ Crear tu lista personalizada</li>
        <li>🏆 Desbloquear logros y subir de nivel</li>
        <li>💰 Ganar Aura leyendo y participando</li>
        <li>✍️ Crear y publicar tus propias historias</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/explore" class="button">Explorar Mangas</a>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">
        ¿Tienes preguntas? Visita nuestro <a href="${APP_URL}/help" style="color: ${COLORS.primary};">Centro de Ayuda</a>
      </p>
    </div>
    ${baseFooter()}
  `);

  const text = `
¡Bienvenido a MangaAura, ${username}!

Hola ${username}! 👋

Bienvenido a MangaAura, tu nuevo hogar para descubrir, leer y crear mangas increíbles.

🎁 BONUS DE BIENVENIDA
Hemos agregado 50 Aura a tu cuenta para que empieces a disfrutar.

CON MANGA AURA PUEDES:
📚 Descubrir miles de mangas únicos
⭐ Crear tu lista personalizada
🏆 Desbloquear logros y subir de nivel
💰 Ganar Aura leyendo y participando
✍️ Crear y publicar tus propias historias

EMPIEZA AHORA: ${APP_URL}/explore

¿Tienes preguntas? Visita: ${APP_URL}/help

---
MangaAura © ${new Date().getFullYear()}
Gestionar preferencias: ${APP_URL}/settings/notifications
  `;

  return { subject, html, text };
}

// ============================================================================
// Password Reset Template
// ============================================================================

export function getPasswordResetTemplate(username: string, resetLink: string): EmailTemplate {
  const subject = '🔐 Recuperación de contraseña - MangaAura';

  const html = baseTemplate(`
    ${baseHeader()}
    <div class="content">
      <h2 style="color: ${COLORS.text}; margin-top: 0;">Recuperación de contraseña</h2>
      
      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6;">
        Hola <span class="highlight">${username}</span>,
      </p>

      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6;">
        Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" class="button" style="background: ${COLORS.warning};">Restablecer contraseña</a>
      </div>

      <div class="card">
        <p style="color: ${COLORS.textMuted}; margin: 0; font-size: 14px;">
          <strong>⚠️ Este enlace expirará en 1 hora.</strong><br>
          Si no solicitaste este cambio, puedes ignorar este email.
        </p>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 14px; margin-top: 24px;">
        Si el botón no funciona, copia y pega este enlace en tu navegador:
      </p>
      <p style="word-break: break-all; color: ${COLORS.primary}; font-size: 12px;">
        ${resetLink}
      </p>
    </div>
    ${baseFooter()}
  `);

  const text = `
Recuperación de contraseña - MangaAura

Hola ${username},

Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:

${resetLink}

⚠️ Este enlace expirará en 1 hora.
Si no solicitaste este cambio, puedes ignorar este email.

---
MangaAura © ${new Date().getFullYear()}
  `;

  return { subject, html, text };
}

// ============================================================================
// New Chapter Template
// ============================================================================

export function getNewChapterTemplate(
  username: string,
  mangaTitle: string,
  chapterTitle: string,
  chapterLink: string,
  coverUrl?: string | null
): EmailTemplate {
  const subject = `📖 Nuevo capítulo de ${mangaTitle}`;

  const html = baseTemplate(`
    ${baseHeader()}
    <div class="content">
      <div class="badge">¡NUEVO CAPÍTULO!</div>
      
      <h2 style="color: ${COLORS.text}; margin-top: 8px;">Hola ${username} 👋</h2>
      
      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6;">
        Un manga que sigues acaba de publicar un nuevo capítulo:
      </p>

      <div class="card" style="text-align: center;">
        ${coverUrl ? `<img src="${coverUrl}" alt="${mangaTitle}" class="cover-image" />` : ''}
        <h3 style="color: ${COLORS.text}; margin: 8px 0;">${mangaTitle}</h3>
        <p style="color: ${COLORS.secondary}; font-size: 18px; font-weight: 600; margin: 0;">
          ${chapterTitle}
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${chapterLink}" class="button">📖 Leer ahora</a>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">
        ¿No quieres recibir estas notificaciones? 
        <a href="${APP_URL}/settings/notifications" style="color: ${COLORS.primary};">Gestionar preferencias</a>
      </p>
    </div>
    ${baseFooter()}
  `);

  const text = `
📖 Nuevo capítulo de ${mangaTitle}

Hola ${username},

Un manga que sigues acaba de publicar un nuevo capítulo:

${mangaTitle}
${chapterTitle}

LEER AHORA: ${chapterLink}

---
MangaAura © ${new Date().getFullYear()}
Gestionar preferencias: ${APP_URL}/settings/notifications
  `;

  return { subject, html, text };
}

// ============================================================================
// Achievement Template
// ============================================================================

export function getAchievementTemplate(
  username: string,
  achievementName: string,
  xpReward: number,
  iconUrl?: string | null
): EmailTemplate {
  const subject = `🏆 ¡Logro desbloqueado: ${achievementName}!`;

  const html = baseTemplate(`
    ${baseHeader()}
    <div class="content">
      <div style="text-align: center; padding: 16px 0;">
        <div style="font-size: 72px; margin-bottom: 16px;">
          ${iconUrl ? `<img src="${iconUrl}" alt="${achievementName}" style="width: 80px; height: 80px;" />` : '🏆'}
        </div>
        <div class="badge">LOGRO DESBLOQUEADO</div>
      </div>
      
      <h2 style="color: ${COLORS.text}; text-align: center; margin: 8px 0;">
        ¡Felicidades, ${username}!
      </h2>
      
      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6; text-align: center;">
        Has desbloqueado un nuevo logro:
      </p>

      <div class="card" style="text-align: center; border-color: ${COLORS.success};">
        <h3 style="color: ${COLORS.success}; margin: 0; font-size: 24px;">
          ${achievementName}
        </h3>
        <p style="color: ${COLORS.secondary}; font-size: 18px; font-weight: 600; margin: 8px 0 0;">
          +${xpReward} XP
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/profile/achievements" class="button">Ver todos mis logros</a>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">
        Sigue leyendo y participando para desbloquear más logros. ¡Hay muchos más esperándote!
      </p>
    </div>
    ${baseFooter()}
  `);

  const text = `
🏆 ¡Logro desbloqueado: ${achievementName}!

¡Felicidades, ${username}!

Has desbloqueado un nuevo logro:

${achievementName}
+${xpReward} XP

Ver todos mis logros: ${APP_URL}/profile/achievements

Sigue leyendo y participando para desbloquear más logros. ¡Hay muchos más esperándote!

---
MangaAura © ${new Date().getFullYear()}
  `;

  return { subject, html, text };
}

// ============================================================================
// Tip Received Template
// ============================================================================

export function getTipReceivedTemplate(
  username: string,
  fromUsername: string,
  amount: number,
  message?: string | null
): EmailTemplate {
  const subject = `💰 ¡Has recibido ${amount} Aura de ${fromUsername}!`;

  const html = baseTemplate(`
    ${baseHeader()}
    <div class="content">
      <div style="text-align: center; padding: 16px 0;">
        <div style="font-size: 48px; margin-bottom: 8px;">💰</div>
        <div class="badge">NUEVA PROPINA</div>
      </div>
      
      <h2 style="color: ${COLORS.text}; text-align: center; margin: 8px 0;">
        ¡Hola ${username}!
      </h2>
      
      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6; text-align: center;">
        <span class="highlight">${fromUsername}</span> te ha enviado una propina:
      </p>

      <div class="card" style="text-align: center; border-color: ${COLORS.success};">
        <div style="font-size: 48px; font-weight: bold; color: ${COLORS.success}; margin: 0;">
          ${amount}
        </div>
        <div style="color: ${COLORS.textMuted}; font-size: 14px;">Aura</div>
      </div>

      ${message ? `
      <div class="card">
        <p style="color: ${COLORS.textMuted}; margin: 0; font-style: italic;">
          "${message}"
        </p>
        <p style="color: ${COLORS.textMuted}; margin: 8px 0 0; font-size: 12px; text-align: right;">
          - ${fromUsername}
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${APP_URL}/profile/transactions" class="button">Ver transacciones</a>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">
        ¡Gracias por crear contenido increíble! Tus lectores aprecian tu trabajo.
      </p>
    </div>
    ${baseFooter()}
  `);

  const text = `
💰 ¡Has recibido ${amount} Aura de ${fromUsername}!

¡Hola ${username}!

${fromUsername} te ha enviado una propina:

${amount} Aura

${message ? `Mensaje: "${message}" - ${fromUsername}` : ''}

Ver transacciones: ${APP_URL}/profile/transactions

¡Gracias por crear contenido increíble! Tus lectores aprecian tu trabajo.

---
MangaAura © ${new Date().getFullYear()}
  `;

  return { subject, html, text };
}

// ============================================================================
// Crowdfunding Goal Reached Template
// ============================================================================

export function getCrowdfundingGoalReachedTemplate(
  username: string,
  mangaTitle: string,
  chapterTitle: string,
  chapterLink: string
): EmailTemplate {
  const subject = `🎉 ¡Meta alcanzada! ${mangaTitle} - ${chapterTitle}`;

  const html = baseTemplate(`
    ${baseHeader()}
    <div class="content">
      <div style="text-align: center; padding: 16px 0;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <div class="badge" style="background-color: ${COLORS.success};">CROWDFUNDING COMPLETADO</div>
      </div>
      
      <h2 style="color: ${COLORS.text}; text-align: center; margin: 8px 0;">
        ¡Enhorabuena, ${username}!
      </h2>
      
      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6; text-align: center;">
        La meta de crowdfunding ha sido alcanzada:
      </p>

      <div class="card" style="text-align: center; border-color: ${COLORS.success};">
        <h3 style="color: ${COLORS.text}; margin: 0;">${mangaTitle}</h3>
        <p style="color: ${COLORS.secondary}; font-size: 18px; font-weight: 600; margin: 8px 0;">
          ${chapterTitle}
        </p>
        <p style="color: ${COLORS.success}; font-size: 14px; margin: 0;">
          ✓ Financiado por la comunidad
        </p>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 16px; line-height: 1.6;">
        Gracias a las contribuciones de los fans, este capítulo será publicado. 
        Tu apoyo hace posible que los creadores sigan produciendo contenido increíble.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${chapterLink}" class="button" style="background: ${COLORS.success};">Ver capítulo</a>
      </div>

      <p style="color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">
        ¡Comparte el logro con tus amigos!
      </p>
    </div>
    ${baseFooter()}
  `);

  const text = `
🎉 ¡Meta alcanzada! ${mangaTitle} - ${chapterTitle}

¡Enhorabuena, ${username}!

La meta de crowdfunding ha sido alcanzada:

${mangaTitle}
${chapterTitle}
✓ Financiado por la comunidad

Gracias a las contribuciones de los fans, este capítulo será publicado. Tu apoyo hace posible que los creadores sigan produciendo contenido increíble.

Ver capítulo: ${chapterLink}

¡Comparte el logro con tus amigos!

---
MangaAura © ${new Date().getFullYear()}
  `;

  return { subject, html, text };
}
