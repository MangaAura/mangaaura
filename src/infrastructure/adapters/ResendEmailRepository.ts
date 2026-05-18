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
      const fromEmail = process.env.EMAIL_FROM || 'noreply@inkverse.app';
      const fromName = process.env.EMAIL_FROM_NAME || 'InkVerse';
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
    console.warn(`[EmailRepository] sendTemplate not fully implemented for: ${template}`);
    const subject = `Template: ${template}`;
    const html = `<p>Template: ${template}</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
    await this.sendEmail(to, subject, html);
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
      ctaUrl: 'https://inkverse.app/profile',
    });
    return { subject, html, text };
  }

  renderTipReceivedEmail(_username: string, senderName: string, amount: number, _link: string): EmailTemplate {
    const subject = `💰 ¡Has recibido ${amount} InkCoins de ${senderName}!`;
    const { html, text } = baseEmailTemplate({
      title: '💰 ¡Recibiste una propina!',
      preview: `${senderName} te envió ${amount} InkCoins`,
      content: `
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; margin-bottom: 20px;">
          <span style="font-size: 48px;">💰</span>
          <h3 style="margin: 10px 0 0 0; color: white; font-size: 24px;">+${amount} InkCoins</h3>
        </div>
        <p><strong>${senderName}</strong> te ha enviado una propina.</p>
        <p style="margin-top: 15px;">¡Gracias por crear contenido increíble para la comunidad!</p>
      `,
      ctaText: 'Ver transacciones',
      ctaUrl: 'https://inkverse.app/profile/transactions',
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
}
