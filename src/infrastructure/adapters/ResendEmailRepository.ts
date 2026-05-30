import nodemailer from 'nodemailer';
import { Resend } from 'resend';

import type {
  IEmailRepository,
  IEmailTemplateService,
  EmailPreferences,
  EmailTemplate,
  SendEmailResult,
} from '@/core/services/IEmailRepository';
import {
  welcomeEmail,
  passwordResetEmail,
  newChapterEmail,
  baseEmailTemplate,
} from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';

export class ResendEmailRepository implements IEmailRepository, IEmailTemplateService {
  private provider: 'resend' | 'smtp' | 'console';
  private resendClient?: Resend;
  private smtpTransporter?: nodemailer.Transporter;

  static readonly DEFAULT_PREFERENCES: EmailPreferences = {
    welcome: true,
    newChapters: true,
    commentReplies: true,
    tips: true,
    achievements: true,
    marketing: false,
    crowdfundingUpdates: true,
    passwordReset: true,
  };

  constructor() {
    this.provider = this.detectProvider();
    this.initializeProvider();
  }

  private detectProvider(): 'resend' | 'smtp' | 'console' {
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
      return 'resend';
    }
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      return 'smtp';
    }
    if (process.env.NODE_ENV === 'development') {
      console.info('[EmailRepository] Email not configured - using console fallback');
      return 'console';
    }
    return 'console';
  }

  private initializeProvider(): void {
    switch (this.provider) {
      case 'resend':
        this.resendClient = new Resend(process.env.RESEND_API_KEY!);
        console.info('[EmailRepository] Using Resend provider');
        break;
      case 'smtp':
        this.smtpTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: parseInt(process.env.SMTP_PORT || '587') === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        console.info('[EmailRepository] Using SMTP provider');
        break;
      default:
        console.info('[EmailRepository] Using console provider (emails will be logged)');
    }
  }

  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<SendEmailResult> {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'noreply@mangaaura.es';
      const fromName = process.env.EMAIL_FROM_NAME || 'MangaAura';
      const from = `${fromName} <${fromEmail}>`;

      const template: EmailTemplate = {
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      };

      switch (this.provider) {
        case 'resend':
          return this.sendWithResend(to, from, template);
        case 'smtp':
          return this.sendWithSMTP(to, from, template);
        default:
          return this.sendToConsole(to, from, template);
      }
    } catch (error) {
      console.error('[EmailRepository] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendTemplate(template: string, to: string, data: Record<string, unknown>): Promise<void> {
    // Map template name to renderer
    const renderers: Record<string, () => { subject: string; html: string; text: string }> = {
      'welcome': () => {
        const username = (data.username || data.displayName || data.name || 'Usuario') as string;
        const tpl = this.renderWelcomeEmail(username);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
      'password-reset': () => {
        const username = (data.username || data.displayName || '') as string;
        const resetLink = (data.resetLink || data.url || data.resetUrl || '#') as string;
        const tpl = this.renderPasswordResetEmail(username, resetLink);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
      'new-chapter': () => {
        const username = (data.username || '') as string;
        const mangaTitle = (data.mangaTitle || data.title || 'Manga') as string;
        const chapterNumber = (data.chapterNumber || data.chapter || 1) as number;
        const link = (data.link || data.url || '#') as string;
        const tpl = this.renderNewChapterNotification(username, mangaTitle, chapterNumber, link);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
      'achievement': () => {
        const username = (data.username || '') as string;
        const achievementName = (data.achievementName || data.name || data.achievement || 'Logro') as string;
        const tpl = this.renderAchievementEmail(username, achievementName);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
      'tip-received': () => {
        const username = (data.username || '') as string;
        const senderName = (data.senderName || data.from || 'Usuario') as string;
        const amount = (data.amount || data.tipAmount || 0) as number;
        const link = (data.link || data.url || '#') as string;
        const tpl = this.renderTipReceivedEmail(username, senderName, amount, link);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
      'crowdfunding-goal': () => {
        const username = (data.username || '') as string;
        const mangaTitle = (data.mangaTitle || data.title || 'Manga') as string;
        const goal = (data.goal || data.target || 0) as number;
        const link = (data.link || data.url || '#') as string;
        const tpl = this.renderCrowdfundingGoalEmail(username, mangaTitle, goal, link);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
      'comment-reply': () => {
        const username = (data.username || '') as string;
        const replierName = (data.replierName || data.from || 'Usuario') as string;
        const chapterTitle = (data.chapterTitle || data.title || 'Capítulo') as string;
        const link = (data.link || data.url || '#') as string;
        const tpl = this.renderCommentReplyEmail(username, replierName, chapterTitle, link);
        return { subject: tpl.subject, html: tpl.html, text: tpl.text };
      },
    };

    const renderer = renderers[template];
    if (renderer) {
      const tpl = renderer();
      await this.sendEmail(to, tpl.subject, tpl.html, tpl.text);
    } else {
      console.warn(`[EmailRepository] Unknown template: ${template}, using fallback`);
      const subject = (data.subject || `Notification: ${template}`) as string;
      const body = (data.body || data.message || `<p>Template: ${template}</p>`) as string;
      await this.sendEmail(to, subject, body);
    }
  }

  private async sendWithResend(to: string, from: string, template: EmailTemplate): Promise<SendEmailResult> {
    if (!this.resendClient) {
      throw new Error('Resend client not initialized');
    }

    const { data, error } = await this.resendClient.emails.send({
      from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }

    return {
      success: true,
      messageId: data?.id,
    };
  }

  private async sendWithSMTP(to: string, from: string, template: EmailTemplate): Promise<SendEmailResult> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized');
    }

    const info = await this.smtpTransporter.sendMail({
      from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  }

  private async sendToConsole(to: string, from: string, template: EmailTemplate): Promise<SendEmailResult> {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL ENVIADO (MODO DESARROLLO)');
    console.log('='.repeat(60));
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${template.subject}`);
    console.log('-'.repeat(60));
    console.log('Text Content:');
    console.log(template.text);
    console.log('-'.repeat(60));
    console.log('HTML Content (first 500 chars):');
    console.log(template.html.substring(0, 500) + '...');
    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      messageId: `console-${Date.now()}`,
    };
  }

  async getEmailPreferences(userId: string): Promise<EmailPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailPreferences: true },
      });

      return {
        ...ResendEmailRepository.DEFAULT_PREFERENCES,
        ...(user?.emailPreferences ? (user.emailPreferences as unknown as Record<string, boolean>) : {}),
      };
    } catch (error) {
      console.error('[EmailRepository] Error getting email preferences:', error);
      return ResendEmailRepository.DEFAULT_PREFERENCES;
    }
  }

  async updateEmailPreferences(userId: string, preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
    try {
      const currentPreferences = await this.getEmailPreferences(userId);
      const newPreferences = { ...currentPreferences, ...preferences };

      await prisma.user.update({
        where: { id: userId },
        data: {
          emailPreferences: newPreferences as Record<string, boolean>,
        },
      });

      return newPreferences;
    } catch (error) {
      console.error('[EmailRepository] Error updating email preferences:', error);
      throw error;
    }
  }

  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      switch (this.provider) {
        case 'resend':
          return {
            success: true,
            message: 'Resend API key configurada correctamente',
          };
        case 'smtp':
          if (this.smtpTransporter) {
            await this.smtpTransporter.verify();
            return {
              success: true,
              message: 'Conexión SMTP verificada correctamente',
            };
          }
          return {
            success: false,
            message: 'SMTP transporter no inicializado',
          };
        default:
          return {
            success: true,
            message: 'Modo consola activo (desarrollo)',
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error de conexión',
      };
    }
  }

  // ============================================================================
  // IEmailTemplateService Implementation
  // ============================================================================

  renderWelcomeEmail(username: string): EmailTemplate {
    const { html, text, subject } = welcomeEmail(username);
    return { subject, html, text };
  }

  renderPasswordResetEmail(_username: string, resetLink: string): EmailTemplate {
    const { html, text, subject } = passwordResetEmail(resetLink);
    return { subject, html, text };
  }

  renderNewChapterNotification(_username: string, mangaTitle: string, chapterNumber: number, link: string): EmailTemplate {
    const chapterTitle = `Capítulo ${chapterNumber}`;
    const { html, text, subject } = newChapterEmail(mangaTitle, chapterNumber, chapterTitle, link);
    return { subject, html, text };
  }

  renderAchievementEmail(_username: string, achievementName: string): EmailTemplate {
    const subject = `🏆 ¡Logro desbloqueado: ${achievementName}!`;
    const { html, text } = baseEmailTemplate({
      title: '🏆 ¡Logro desbloqueado!',
      preview: `Has desbloqueado: ${achievementName}`,
      content: `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 12px; margin-bottom: 20px;">
          <span style="font-size: 48px;">🏆</span>
          <h3 style="margin: 10px 0 0 0; color: white; font-size: 20px;">${achievementName}</h3>
        </div>
        <p>¡Felicidades! Has desbloqueado el logro <strong>${achievementName}</strong>.</p>
        <p style="margin-top: 15px;">Sigue leyendo y participando para desbloquear más logros.</p>
      `,
      ctaText: 'Ver mi perfil',
      ctaUrl: 'https://mangaaura.es/profile',
    });
    return { subject, html, text };
  }

  renderTipReceivedEmail(_username: string, senderName: string, amount: number, _link: string): EmailTemplate {
    const subject = `💰 ¡Has recibido ${amount} Aura de ${senderName}!`;
    const { html, text } = baseEmailTemplate({
      title: '💰 ¡Recibiste una propina!',
      preview: `${senderName} te envió ${amount} Aura`,
      content: `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; margin-bottom: 20px;">
          <span style="font-size: 48px;">💰</span>
          <h3 style="margin: 10px 0 0 0; color: white; font-size: 24px;">+${amount} Aura</h3>
        </div>
        <p><strong>${senderName}</strong> te ha enviado una propina.</p>
        <p style="margin-top: 15px;">¡Gracias por crear contenido increíble para la comunidad!</p>
      `,
      ctaText: 'Ver transacciones',
      ctaUrl: 'https://mangaaura.es/profile/transactions',
    });
    return { subject, html, text };
  }

  renderCrowdfundingGoalEmail(_username: string, mangaTitle: string, _goal: number, link: string): EmailTemplate {
    const subject = `🎉 ¡Meta alcanzada! ${mangaTitle}`;
    const { html, text } = baseEmailTemplate({
      title: '🎯 ¡Meta de crowdfunding alcanzada!',
      preview: `Tu capítulo de "${mangaTitle}" ha sido financiado`,
      content: `
        <p>¡Felicidades!</p>
        <p style="margin-top: 15px;">El capítulo de <strong>"${mangaTitle}"</strong> ha alcanzado su meta de crowdfunding.</p>
        <p style="margin-top: 15px;">Tu contenido será publicado pronto. ¡Gracias a todos los patrocinadores!</p>
      `,
      ctaText: 'Ver capítulo',
      ctaUrl: link,
    });
    return { subject, html, text };
  }

  renderCommentReplyEmail(_username: string, replierName: string, chapterTitle: string, link: string): EmailTemplate {
    const subject = `${replierName} respondió a tu comentario en ${chapterTitle}`;
    const { html, text } = baseEmailTemplate({
      title: `${replierName} respondió a tu comentario`,
      preview: `${replierName} respondió a tu comentario`,
      content: `
        <p><strong>${replierName}</strong> respondió a tu comentario en <strong>"${chapterTitle}"</strong>.</p>
        <p style="margin-top: 15px;">Haz clic en el botón para ver la respuesta completa.</p>
      `,
      ctaText: 'Ver respuesta',
      ctaUrl: link,
    });
    return { subject, html, text };
  }

  renderLevelUpEmail(_username: string, oldLevel: number, newLevel: number): EmailTemplate {
    const subject = `¡Has subido al nivel ${newLevel}!`;
    const { html, text } = baseEmailTemplate({
      title: '⭐ ¡Subida de Nivel!',
      preview: `¡Felicidades! Has subido del nivel ${oldLevel} al nivel ${newLevel}`,
      content: `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; margin-bottom: 20px;">
          <span style="font-size: 48px;">⭐</span>
          <h3 style="margin: 10px 0 0 0; color: white; font-size: 24px;">¡Nivel ${newLevel}!</h3>
        </div>
        <p>¡Felicidades! Has subido del nivel <strong>${oldLevel}</strong> al nivel <strong>${newLevel}</strong>.</p>
        <p style="margin-top: 15px;">Sigue leyendo y participando para seguir subiendo de nivel y desbloquear más recompensas.</p>
      `,
      ctaText: 'Ver mi perfil',
      ctaUrl: 'https://mangaaura.es/profile',
    });
    return { subject, html, text };
  }

  renderMentionEmail(_username: string, mentionerName: string, commentSnippet: string, link: string): EmailTemplate {
    const subject = `${mentionerName} te mencionó en un comentario`;
    const { html, text } = baseEmailTemplate({
      title: `${mentionerName} te mencionó`,
      preview: `${mentionerName} te mencionó en un comentario`,
      content: `
        <p><strong>${mentionerName}</strong> te mencionó en un comentario:</p>
        <div style="margin: 15px 0; padding: 15px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #6366f1; color: #475569; font-style: italic;">
          "${commentSnippet}"
        </div>
        <p>Haz clic en el botón para ver el comentario completo.</p>
      `,
      ctaText: 'Ver comentario',
      ctaUrl: link,
    });
    return { subject, html, text };
  }

  renderClanInviteEmail(_username: string, clanName: string, inviterName: string, link: string): EmailTemplate {
    const subject = `${inviterName} te invitó a unirte a ${clanName}`;
    const { html, text } = baseEmailTemplate({
      title: '🎮 ¡Invitación al Clan!',
      preview: `${inviterName} te invitó a unirte a ${clanName}`,
      content: `
        <p><strong>${inviterName}</strong> te ha invitado a unirte al clan <strong>"${clanName}"</strong>.</p>
        <p style="margin-top: 15px;">Los clanes te permiten conectar con otros miembros, participar en eventos exclusivos y ganar recompensas en equipo.</p>
        <p style="margin-top: 15px;">¡No pierdas esta oportunidad!</p>
      `,
      ctaText: 'Ver invitación',
      ctaUrl: link,
    });
    return { subject, html, text };
  }
}
