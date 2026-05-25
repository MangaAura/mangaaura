/**
 * Email module for MangaAura
 *
 * Provides a simple sendEmail wrapper around the existing email infrastructure.
 * Used by API routes that need to send transactional emails.
 */

import { emailService } from '@/infrastructure/adapters/emailService';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured email provider (Resend, SMTP, or console fallback).
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return emailService.sendEmail(to, {
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });
}
