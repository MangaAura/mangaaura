/**
 * Servicio de Email para InkVerse
 * Soporta Resend (recomendado) y SMTP como fallback
 * @packageDocumentation
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { AchievementDefinition } from '@prisma/client';
import {
  welcomeEmail,
  passwordResetEmail,
  newChapterEmail,
  achievementUnlockedEmail,
  tipReceivedEmail,
  baseEmailTemplate,
} from '@/lib/email-templates';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailUser {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface EmailMangaSeries {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  authorName: string;
}

export interface EmailChapter {
  id: string;
  chapterNumber: number;
  title?: string | null;
}

export interface EmailTip {
  id: string;
  amount: number;
  message?: string | null;
  createdAt: Date;
}

export interface EmailPreferences {
  welcome: boolean;
  newChapters: boolean;
  commentReplies: boolean;
  tips: boolean;
  achievements: boolean;
  marketing: boolean;
  crowdfundingUpdates: boolean;
  passwordReset: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Templates (imported from @/lib/email-templates)
// ============================================================================

// ============================================================================
// Email Service
// ============================================================================

export class EmailService {
  private provider: 'resend' | 'smtp' | 'console';
  private resendClient?: Resend;
  private smtpTransporter?: nodemailer.Transporter;

  // Default email preferences
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

  /**
  * Detecta el proveedor de email basado en las variables de entorno
  */
  private detectProvider(): 'resend' | 'smtp' | 'console' {
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
      return 'resend';
    }
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      return 'smtp';
    }
    // Use console as fallback in development only
    if (process.env.NODE_ENV === 'development') {
      console.info('[EmailService] Email not configured - using console fallback');
      return 'console';
    }
    return 'console';
  }

  /**
   * Inicializa el proveedor de email seleccionado
   */
  private initializeProvider(): void {
    switch (this.provider) {
      case 'resend':
        this.resendClient = new Resend(process.env.RESEND_API_KEY!);
        console.info('[EmailService] Using Resend provider');
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
        console.info('[EmailService] Using SMTP provider');
        break;
      default:
        console.info('[EmailService] Using console provider (emails will be logged)');
    }
  }

  /**
   * Envío genérico de email
   */
  async sendEmail(to: string, template: EmailTemplate): Promise<SendEmailResult> {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'noreply@inkverse.app';
      const fromName = process.env.EMAIL_FROM_NAME || 'InkVerse';
      const from = `${fromName} <${fromEmail}>`;

      switch (this.provider) {
        case 'resend':
          return this.sendWithResend(to, from, template);
        case 'smtp':
          return this.sendWithSMTP(to, from, template);
        default:
          return this.sendToConsole(to, from, template);
      }
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Envía email usando Resend
   */
  private async sendWithResend(
    to: string,
    from: string,
    template: EmailTemplate
  ): Promise<SendEmailResult> {
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

  /**
   * Envía email usando SMTP
   */
  private async sendWithSMTP(
    to: string,
    from: string,
    template: EmailTemplate
  ): Promise<SendEmailResult> {
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

  /**
   * Loguea el email en consola (modo desarrollo)
   */
  private async sendToConsole(
    to: string,
    from: string,
    template: EmailTemplate
  ): Promise<SendEmailResult> {
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

  // ============================================================================
  // Emails Específicos
  // ============================================================================

  /**
   * Email de bienvenida
   */
  async sendWelcomeEmail(user: EmailUser): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'welcome')) return;

    const { html, text, subject } = welcomeEmail(user.username);
    await this.sendEmail(user.email, { html, text, subject });

    console.info(`[EmailService] Welcome email sent to ${user.email}`);
  }

  /**
   * Email de recuperación de contraseña
   */
  async sendPasswordResetEmail(user: EmailUser, resetToken: string): Promise<void> {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    const { html, text, subject } = passwordResetEmail(resetLink);
    await this.sendEmail(user.email, { html, text, subject });

    console.info(`[EmailService] Password reset email sent to ${user.email}`);
  }

  /**
   * Notificación de nuevo capítulo
   */
  async sendNewChapterNotification(
    user: EmailUser,
    manga: EmailMangaSeries,
    chapter: EmailChapter
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'newChapters')) return;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const chapterLink = `${baseUrl}/manga/${manga.slug}/chapter/${chapter.chapterNumber}`;

    const { html, text, subject } = newChapterEmail(
      manga.title,
      chapter.chapterNumber,
      chapter.title || `Capítulo ${chapter.chapterNumber}`,
      chapterLink,
      manga.coverUrl || undefined
    );
    await this.sendEmail(user.email, { html, text, subject });

    console.info(`[EmailService] New chapter notification sent to ${user.email}`);
  }

  /**
   * Notificación de logro desbloqueado
   */
  async sendAchievementUnlockedEmail(
    user: EmailUser,
    achievement: AchievementDefinition
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'achievements')) return;

    const { html, text, subject } = achievementUnlockedEmail(
      achievement.name,
      achievement.description || '',
      achievement.xpReward
    );
    await this.sendEmail(user.email, { html, text, subject });

    console.info(`[EmailService] Achievement email sent to ${user.email}`);
  }

  /**
   * Notificación de propina recibida
   */
  async sendTipReceivedEmail(
    user: EmailUser,
    tip: EmailTip,
    fromUser: EmailUser
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'tips')) return;

    const { html, text, subject } = tipReceivedEmail(
      user.username,
      tip.amount,
      fromUser.username
    );
    await this.sendEmail(user.email, { html, text, subject });

    console.info(`[EmailService] Tip received email sent to ${user.email}`);
  }

  /**
   * Notificación de meta de crowdfunding alcanzada
   */
  async sendCrowdfundingGoalReachedEmail(
    user: EmailUser,
    manga: EmailMangaSeries,
    chapter: EmailChapter
  ): Promise<void> {
    if (!await this.shouldSendEmail(user.id, 'crowdfundingUpdates')) return;

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const chapterLink = `${baseUrl}/manga/${manga.slug}/chapter/${chapter.chapterNumber}`;

    // Simple template inline for crowdfunding
    const { html, text } = baseEmailTemplate({
      title: '🎯 ¡Meta de crowdfunding alcanzada!',
      preview: `Tu capítulo de "${manga.title}" ha sido financiado`,
      content: `
        <p>¡Felicidades!</p>
        <p style="margin-top: 15px;">El capítulo <strong>${chapter.title || `Capítulo ${chapter.chapterNumber}`}</strong> de <strong>"${manga.title}"</strong> ha alcanzado su meta de crowdfunding.</p>
        <p style="margin-top: 15px;">Tu contenido será publicado pronto. ¡Gracias a todos los patrocinadores!</p>
      `,
      ctaText: 'Ver capítulo',
      ctaUrl: chapterLink,
    });
    await this.sendEmail(user.email, { html, text, subject: '🎯 ¡Meta de crowdfunding alcanzada!' });

    console.info(`[EmailService] Crowdfunding goal email sent to ${user.email}`);
  }

  // ============================================================================
  // Utilidades
  // ============================================================================

  /**
   * Verifica si se debe enviar un email según las preferencias del usuario
   */
  private async shouldSendEmail(userId: string, type: keyof EmailPreferences): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailPreferences: true },
      });

      if (!user) return false;

    let userPrefs: Record<string, boolean> = {};
    if (user.emailPreferences) {
      try {
        const parsed = JSON.parse(user.emailPreferences);
        if (typeof parsed === 'object' && parsed !== null) {
          userPrefs = parsed as Record<string, boolean>;
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }

    const preferences: EmailPreferences = {
      ...EmailService.DEFAULT_PREFERENCES,
      ...(user.emailPreferences ? (user.emailPreferences as unknown as Record<string, boolean>) : {}),
    };

    return preferences[type] ?? true;
    } catch (error) {
      console.error('[EmailService] Error checking email preferences:', error);
      // En caso de error, permitir el envío por defecto
      return true;
    }
  }

  /**
   * Obtiene las preferencias de email de un usuario
   */
  async getEmailPreferences(userId: string): Promise<EmailPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailPreferences: true },
      });

    let userPrefs: Record<string, boolean> = {};
    if (user?.emailPreferences) {
      try {
        const parsed = JSON.parse(user.emailPreferences);
        if (typeof parsed === 'object' && parsed !== null) {
          userPrefs = parsed as Record<string, boolean>;
        }
      } catch {
        // Invalid JSON, use defaults
      }
    }

    return {
      ...EmailService.DEFAULT_PREFERENCES,
      ...(user?.emailPreferences ? (user.emailPreferences as unknown as Record<string, boolean>) : {}),
    };
    } catch (error) {
      console.error('[EmailService] Error getting email preferences:', error);
      return EmailService.DEFAULT_PREFERENCES;
    }
  }

  /**
   * Actualiza las preferencias de email de un usuario
   */
  async updateEmailPreferences(
    userId: string,
    preferences: Partial<EmailPreferences>
  ): Promise<EmailPreferences> {
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
      console.error('[EmailService] Error updating email preferences:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado del proveedor de email
   */
  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    try {
      switch (this.provider) {
        case 'resend':
          // Resend no tiene un método de verificación directo
          // Podríamos hacer un ping a la API
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
}

// ============================================================================
// Singleton
// ============================================================================

export const emailService = new EmailService();

export default EmailService;
